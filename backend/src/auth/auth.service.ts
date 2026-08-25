import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { LoginDto, RegisterDto, CompleteProfileDto } from './dto/auth.dto';
import { EmailService } from '../common/email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: dto.role || UserRole.BIDDER,
    });

    await this.userRepository.save(user);

    this.emailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
      this.logger.error(`Failed to send welcome email: ${err.message}`);
    });

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async loginWithGoogle(profile: { email: string; name: string }) {
    let user = await this.userRepository.findOne({ where: { email: profile.email } });

    if (!user) {
      user = this.userRepository.create({
        email: profile.email,
        name: profile.name,
        passwordHash: await bcrypt.hash(Math.random().toString(36), 12),
        role: UserRole.BIDDER,
        isEmailVerified: true,
      });
      await this.userRepository.save(user);
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      const resetToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '1h' });
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login/forgot_password/reset_password?token=${resetToken}`;
      this.emailService.sendPasswordResetEmail(email, resetLink).catch((err) => {
        this.logger.error(`Failed to send password reset email: ${err.message}`);
      });
      return { resetToken };
    }
    return null;
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.save(user);
    return { user: this.sanitizeUser(user) };
  }

  async completeProfile(userId: string, dto: CompleteProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (dto.name) user.name = dto.name;
    if (dto.phone !== undefined) (user as any).phone = dto.phone;
    if (dto.address !== undefined) (user as any).address = dto.address;

    await this.userRepository.save(user);
    return { user: this.sanitizeUser(user) };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.save(user);
    return { user: this.sanitizeUser(user) };
  }

  async sendOtp(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return null;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    (user as any).otpCode = otp;
    (user as any).otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await this.userRepository.save(user);
    this.emailService.sendOtpEmail(email, otp).catch((err) => {
      this.logger.error(`Failed to send OTP email: ${err.message}`);
    });
    return { otp };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('User not found');
    if ((user as any).otpCode !== otp) throw new BadRequestException('Invalid OTP');
    if (new Date() > (user as any).otpExpiry) throw new BadRequestException('OTP expired');
    user.isEmailVerified = true;
    (user as any).otpCode = null;
    (user as any).otpExpiry = null;
    await this.userRepository.save(user);
    return { user: this.sanitizeUser(user) };
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...result } = user;
    return result;
  }
}

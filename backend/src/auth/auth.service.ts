import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { randomInt } from 'crypto';
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
      role: dto.role === UserRole.SELLER ? UserRole.SELLER : UserRole.BIDDER,
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

    // A Google/Clerk account has no local password (empty hash); reject it the
    // same way as a wrong password so bcrypt doesn't crash and no account type leaks.
    const isPasswordValid = user.passwordHash
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  /**
   * Sign in (or sign up) with Google. The Google ID token is verified
   * server-side with google-auth-library against GOOGLE_CLIENT_ID before any
   * email is trusted; a first-time Google user is provisioned as a verified
   * bidder with no local password.
   */
  async loginWithGoogle(idToken: string) {
    const payload = await this.verifyGoogleIdToken(idToken);
    const email = payload.email;
    const name = payload.name || email.split('@')[0];

    let user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      user = this.userRepository.create({
        email,
        passwordHash: '', // no local password for Google accounts
        name,
        role: UserRole.BIDDER,
        isEmailVerified: true,
      });
      await this.userRepository.save(user);
    } else {
      if (!user.isEmailVerified) user.isEmailVerified = true;
      if (!user.name) user.name = name;
      await this.userRepository.save(user);
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  /** Verify a Google ID token and return its verified identity claims. */
  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<{ email: string; name?: string; sub: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new UnauthorizedException(
        'Google sign-in is not configured (GOOGLE_CLIENT_ID missing)',
      );
    }
    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.email_verified) {
        throw new Error('ID token is missing a verified email');
      }
      return { email: payload.email, name: payload.name, sub: payload.sub };
    } catch (error: any) {
      this.logger.warn(`Google ID token verification failed: ${error?.message || error}`);
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      const resetToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '1h' });
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login/forgot_password/reset_password?token=${resetToken}`;
      this.emailService.sendPasswordResetEmail(email, resetLink).catch((err) => {
        this.logger.error(`Failed to send password reset email: ${err.message}`);
      });
    }
    // Always respond identically (no token leak, no account enumeration).
    return { success: true, message: 'If the email is registered, a reset link has been sent' };
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
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.address !== undefined) user.address = dto.address;

    await this.userRepository.save(user);
    return { user: this.sanitizeUser(user) };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const isValid = user.passwordHash
      ? await bcrypt.compare(currentPassword, user.passwordHash)
      : false;
    if (!isValid) throw new UnauthorizedException('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.save(user);
    return { user: this.sanitizeUser(user) };
  }

  async sendOtp(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    // No account enumeration: respond identically whether or not the user exists.
    if (!user) {
      return { success: true, message: 'If the email is registered, an OTP has been sent' };
    }
    const otp = randomInt(100000, 1000000).toString();
    user.otpCode = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await this.userRepository.save(user);
    this.emailService.sendOtpEmail(email, otp).catch((err) => {
      this.logger.error(`Failed to send OTP email: ${err.message}`);
    });
    // Never return the OTP in production. A dev echo is kept for local testing only.
    const result: { success: boolean; message: string; devOtp?: string } = {
      success: true,
      message: 'OTP sent',
    };
    if (process.env.NODE_ENV !== 'production') result.devOtp = otp;
    return result;
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.otpCode || !user.otpExpiry) throw new BadRequestException('No OTP requested');
    if (new Date() > user.otpExpiry) throw new BadRequestException('OTP expired');
    if (user.otpCode !== otp) throw new BadRequestException('Invalid OTP');
    user.isEmailVerified = true;
    user.otpCode = null;
    user.otpExpiry = null;
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

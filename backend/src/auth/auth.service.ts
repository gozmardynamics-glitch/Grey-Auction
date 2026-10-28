import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { randomInt } from 'crypto';
import { User, UserRole } from './entities/user.entity';
import { LoginDto, RegisterDto, CompleteProfileDto } from './dto/auth.dto';
import { EmailService } from '../common/email/email.service';
import { AdminMfaService } from '../admin-mfa/admin-mfa.service';

/** The public shape of an account in auth responses. */
export interface SanitizedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  phone: string | null;
  address: string | null;
  clerkId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * What a successful password check yields.
 *
 * For an administrator, a password alone raises `MFA_REQUIRED` /
 * `MFA_ENROLMENT_REQUIRED` instead of returning a session, so "password correct"
 * can never be exchanged for a working session on its own. The second attempt
 * carries the code in the same call, which keeps the token server-side: the
 * browser never holds an unauthenticated-but-privileged credential.
 */
export type LoginResult = { user: SanitizedUser; token: string };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly adminMfa: AdminMfaService,
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

  async login(dto: LoginDto): Promise<LoginResult> {
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

    /**
     * Administrators must prove a second factor. The password check above is only
     * half of it: without a code this answers `MFA_REQUIRED` (or
     * `MFA_ENROLMENT_REQUIRED`) and issues nothing. The client re-submits with the
     * code, which is verified here — so no intermediate credential ever exists to
     * be stolen, replayed or skipped.
     */
    const gate = await this.adminMfa.gateForUser(user.id);
    if (gate?.mfaRequired) {
      if (!dto.code) {
        throw new UnauthorizedException({
          code: gate.enrolmentRequired ? 'MFA_ENROLMENT_REQUIRED' : 'MFA_REQUIRED',
          message: gate.enrolmentRequired
            ? 'Set up two-factor authentication to continue. Administrators cannot sign in without it.'
            : 'Enter the 6-digit code from your authenticator app.',
        });
      }
      await this.adminMfa.verifySecondFactor(user.id, dto.code, {
        allowRecovery: true,
        // An admin who started enrolment has a pending secret; the first code
        // from it is what completes the enrolment and signs them in.
        allowPendingEnrolment: true,
      });
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  /**
   * Re-verify the password for the pre-session enrolment step.
   *
   * Enrolment has to happen before there is a session — otherwise the only way
   * to set up a second factor would be to sign in without one.
   */
  async authenticateForEnrolment(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    const isPasswordValid =
      user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !isPasswordValid || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const gate = await this.adminMfa.gateForUser(user.id);
    if (!gate?.mfaRequired) {
      // An ordinary account has nothing to enrol here.
      throw new UnauthorizedException('Two-factor authentication is not required for this account');
    }
    if (!gate.enrolmentRequired) {
      throw new UnauthorizedException(
        'Two-factor authentication is already set up for this account. Sign in with your code instead.',
      );
    }
    return user;
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
      // `typ` marks the purpose. Without it this token was byte-identical in shape
      // to an access token and signed with the same secret, so the reset link in
      // an email was also a full API bearer credential for an hour.
      const resetToken = this.jwtService.sign(
        { sub: user.id, typ: 'password_reset' },
        { expiresIn: '1h' },
      );
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login/forgot_password/reset_password?token=${resetToken}`;
      this.emailService.sendPasswordResetEmail(email, resetLink).catch((err) => {
        this.logger.error(`Failed to send password reset email: ${err.message}`);
      });
    }
    // Always respond identically (no token leak, no account enumeration).
    return { success: true, message: 'If the email is registered, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub: string; typ?: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Only a token minted for this purpose may reset a password. An access token
    // (no `typ`) is rejected, which closes "change the password with a stolen
    // session token and no knowledge of the current one".
    if (payload.typ !== 'password_reset') {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found');
    // A soft-deleted account must not be re-armed by a reset link.
    if (!user.isActive) throw new UnauthorizedException('This account is not active');

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.save(user);
    return { user: this.sanitizeUser(user) };
  }

  /** The caller's own profile, in the same shape login returns. */
  async findProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
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

  /**
   * Soft-delete an account: deactivate it and scramble the credential so the
   * user can no longer sign in, while leaving historical bids/invoices intact
   * for accounting and audit purposes.
   */
  async deleteAccount(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    user.isActive = false;
    user.isEmailVerified = false;
    // Revoke the ability to authenticate with the old password.
    user.passwordHash = await bcrypt.hash(
      `deleted-${userId}-${Date.now()}-${Math.random()}`,
      12,
    );
    await this.userRepository.save(user);

    return { id: user.id, deleted: true };
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

  /**
   * Explicit public projection for auth responses. Destructuring-with-rest
   * ({ passwordHash, ...rest }) was replaced here: spreading an entity loses
   * its class prototype, so the @Exclude({ toPlainOnly }) metadata on
   * passwordHash/otpCode/otpExpiry no longer applied and PENDING OTP CODES
   * were serialized on the wire in every /auth/* response (2026-09-08
   * regression found during the G-wave verification).
   */
  private sanitizeUser(user: User): SanitizedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      phone: user.phone ?? null,
      address: user.address ?? null,
      clerkId: user.clerkId ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

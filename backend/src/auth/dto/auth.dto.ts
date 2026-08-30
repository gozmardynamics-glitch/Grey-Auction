import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  // Public self-registration may only create bidder or seller accounts.
  // ADMIN is deliberately excluded to prevent privilege escalation (S12).
  @IsOptional()
  @IsIn([UserRole.BIDDER, UserRole.SELLER])
  role?: UserRole;
}

export class OauthGoogleDto {
  @IsString()
  idToken: string;

  @IsString()
  accessToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class CompleteProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

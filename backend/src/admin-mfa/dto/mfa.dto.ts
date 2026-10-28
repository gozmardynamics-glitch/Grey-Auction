import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Six digits, from an authenticator app. Spacing is tolerated. */
const CODE_PATTERN = /^[\d\s]{6,9}$/;

export class VerifyMfaDto {
  @ApiProperty({ description: 'Token returned by /auth/login when a second factor is required' })
  @IsString()
  @MaxLength(2000)
  challengeToken: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MaxLength(20)
  code: string;
}

export class EnrolBeginDto {
  @ApiProperty({ description: 'Token returned by /auth/login when a second factor is required' })
  @IsString()
  @MaxLength(2000)
  challengeToken: string;
}

export class EnrolConfirmDto {
  @ApiProperty({ description: 'Token returned by /auth/login when a second factor is required' })
  @IsString()
  @MaxLength(2000)
  challengeToken: string;

  @ApiProperty({ example: '123456', description: 'A code from the authenticator once it is added' })
  @IsString()
  @MaxLength(20)
  code: string;
}

/** Step-up re-authentication for a signed-in administrator. */
export class StepUpDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(CODE_PATTERN, { message: 'Enter the 6-digit code from your authenticator app' })
  code: string;
}

/** Setting up or rotating a device from an authenticated session. */
export class AuthenticatedEnrolConfirmDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(CODE_PATTERN, { message: 'Enter the 6-digit code from your authenticator app' })
  code: string;
}

export class RoleMfaPolicyDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  required: boolean;

  @ApiProperty({
    example: 10,
    description:
      'How many minutes a second-factor proof stays valid for consequential actions. ' +
      'Shorter for the roles with more power.',
  })
  @IsInt()
  @Min(1)
  @Max(120)
  stepUpMinutes: number;
}

export class UpdateMfaPolicyDto {
  @ApiPropertyOptional({
    description:
      'Master switch. Turning this off lets administrators sign in with a password alone — ' +
      'it is refused in production unless MFA_ALLOW_DISABLE is set.',
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ type: Object, description: 'Per-role requirement and step-up window' })
  @IsOptional()
  @IsObject()
  roles?: Record<string, RoleMfaPolicyDto>;
}

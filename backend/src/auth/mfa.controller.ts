import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

import { AuthService } from './auth.service';
import { AdminMfaService } from '../admin-mfa/admin-mfa.service';

class BeginEnrolmentDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(200)
  password: string;
}

/**
 * Enrolment for an administrator who has never set up a second factor.
 *
 * This is the one step that has to happen before a session exists — the login
 * gate refuses to issue a token until MFA is armed. The password is re-checked
 * here (bcrypt, same as login) and the response carries the secret, the otpauth
 * URI and the recovery codes; nothing is armed until the first code from that
 * secret is presented to /auth/login, which returns the session.
 *
 * Deliberately no token is returned from this route: an enrolled-but-unproved
 * account must not be able to obtain a working credential.
 */
@ApiTags('Auth · MFA')
@Controller('auth/mfa')
export class MfaController {
  constructor(
    private readonly authService: AuthService,
    private readonly mfa: AdminMfaService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('enrol/begin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start authenticator setup for an administrator (password required)' })
  async beginEnrolment(@Body() dto: BeginEnrolmentDto) {
    const user = await this.authService.authenticateForEnrolment(dto.email, dto.password);
    const data = await this.mfa.beginEnrolment(user.id);
    return {
      success: true,
      message:
        'Scan the code with your authenticator app and store your recovery codes, then sign in with the 6-digit code.',
      data,
    };
  }
}

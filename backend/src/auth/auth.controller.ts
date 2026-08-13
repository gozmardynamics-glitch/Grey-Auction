import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Headers, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ClerkService } from './clerk.service';
import { LoginDto, RegisterDto, OauthGoogleDto, ForgotPasswordDto, ResetPasswordDto, CompleteProfileDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly clerkService: ClerkService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return { success: true, message: 'Registration successful', data: result };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return { success: true, message: 'Login successful', data: result };
  }

  @Post('oauth/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google OAuth' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Google login successful' })
  async googleLogin(@Body() dto: OauthGoogleDto) {
    const result = await this.authService.loginWithGoogle({
      email: dto.idToken,
      name: dto.accessToken,
    });
    return { success: true, message: 'Google login successful', data: result };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto.email);
    return { success: true, message: 'If email exists, reset link sent', data: result };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto.token, dto.newPassword);
    return { success: true, message: 'Password reset successful', data: result };
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete user profile' })
  async completeProfile(@Body() dto: CompleteProfileDto, @CurrentUser() user: any) {
    const result = await this.authService.completeProfile(user.id, dto);
    return { success: true, message: 'Profile updated', data: result };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @Body() dto: { currentPassword: string; newPassword: string },
    @CurrentUser() user: any,
  ) {
    const result = await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
    return { success: true, message: 'Password changed', data: result };
  }

  @Post('send-otp')
  @ApiOperation({ summary: 'Send email verification OTP' })
  async sendOtp(@Body() dto: { email: string }) {
    const result = await this.authService.sendOtp(dto.email);
    return { success: true, message: 'OTP sent', data: result };
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify email OTP' })
  async verifyOtp(@Body() dto: { email: string; otp: string }) {
    const result = await this.authService.verifyOtp(dto.email, dto.otp);
    return { success: true, message: 'Email verified', data: result };
  }

  @Post('clerk/invite-member')
  @ApiOperation({ summary: 'Invite a user to a Clerk organization (org sellers)' })
  async clerkInviteMember(
    @Body() dto: { organizationId: string; email: string; role?: string },
  ) {
    const result = await this.clerkService.inviteMember(
      dto.organizationId,
      dto.email,
      dto.role || 'org:member',
    );
    return { success: true, data: result };
  }

  @Post('clerk/webhook')
  @ApiOperation({ summary: 'Clerk webhook — sync user.created/user.updated' })
  async clerkWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: any,
  ) {
    // Verify signature when CLERK_WEBHOOK_SIGNING_SECRET is configured
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
      const { verified } = await this.clerkService.verifyWebhookSignature(
        req.rawBody,
        headers,
      );
      if (!verified && process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    const type: string = body?.type || '';
    const data = body?.data || {};

    if (type === 'user.created' || type === 'user.updated') {
      const email = data?.email_addresses?.[0]?.email_address || '';
      const name = `${data?.first_name || ''} ${data?.last_name || ''}`.trim();
      const role = data?.public_metadata?.role || 'buyer';

      if (data?.id && email) {
        await this.clerkService.syncUser({
          sub: data.id,
          email,
          name: name || email.split('@')[0],
          role,
        });
      }
    }

    return { success: true, message: 'Webhook processed' };
  }
}

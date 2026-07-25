import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, OauthGoogleDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}

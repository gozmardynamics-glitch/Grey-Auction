import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty() role: string;
  @ApiProperty() isEmailVerified: boolean;
  @ApiProperty() isActive: boolean;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto }) user: AuthUserDto;
  @ApiProperty() token: string;
}

export class AuthApiResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() message?: string;
  @ApiProperty({ type: AuthResponseDto }) data: AuthResponseDto;
}

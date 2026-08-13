import { IsString, IsEnum, IsOptional, IsNumber, IsEmail, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InviteExpiry } from '../invite.entity';

export class GenerateInviteDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(InviteExpiry)
  expiry?: InviteExpiry;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsage?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  inviteeEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  inviteeName?: string;

  @ApiProperty({ required: false, description: 'E.164 phone for SMS invite' })
  @IsOptional()
  @IsString()
  inviteePhone?: string;

  @ApiProperty({ required: false, enum: ['exclusive', 'request'] })
  @IsOptional()
  @IsEnum(['exclusive', 'request'])
  mode?: 'exclusive' | 'request';
}

export class ValidateInviteDto {
  @ApiProperty()
  @IsString()
  token: string;
}

export class RespondInviteDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ enum: ['accepted', 'declined'] })
  @IsEnum(['accepted', 'declined'])
  response: 'accepted' | 'declined';
}

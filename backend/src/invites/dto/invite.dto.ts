import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
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
}

export class ValidateInviteDto {
  @ApiProperty()
  @IsString()
  token: string;
}

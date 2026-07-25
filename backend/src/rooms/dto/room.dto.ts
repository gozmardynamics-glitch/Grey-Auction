import { IsString, IsOptional, IsBoolean, IsArray, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  auctionIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowInviteCode?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  inviteCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requiresDeposit?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  depositAmount?: number;
}

export class JoinRoomDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  inviteCode?: string;
}

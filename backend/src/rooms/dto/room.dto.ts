import { IsString, IsOptional, IsBoolean, IsArray, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoomType } from '../entities/room.entity';

export class CreateRoomDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Private rooms are invite-only; public rooms are listed for everyone. The
   * entity defaults to public, so a seller creating an invite-only room must say
   * so explicitly.
   */
  @ApiProperty({ required: false, enum: RoomType })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;

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

  /** Token from an invitation email — the credential a private room hands out. */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  inviteToken?: string;
}

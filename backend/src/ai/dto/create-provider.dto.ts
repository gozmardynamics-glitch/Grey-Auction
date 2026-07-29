import { IsString, IsOptional, IsBoolean, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProviderTier } from '../entities/llm-provider.entity';

export class CreateProviderDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty()
  @IsString()
  baseUrl: string;

  @ApiProperty()
  @IsString()
  apiKey: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiProperty({ required: false, enum: ProviderTier, default: ProviderTier.PRODUCTION })
  @IsOptional()
  @IsEnum(ProviderTier)
  tier?: ProviderTier;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

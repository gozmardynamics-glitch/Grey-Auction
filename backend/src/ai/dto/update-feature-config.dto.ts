import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FeatureQuality } from '../entities/ai-feature-config.entity';

export class UpdateFeatureConfigDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: FeatureQuality })
  @IsOptional()
  @IsEnum(FeatureQuality)
  quality?: FeatureQuality;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  rateLimitPerMinute?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  rateLimitPerDay?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  primaryModelId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fallbackModelId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tertiaryModelId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

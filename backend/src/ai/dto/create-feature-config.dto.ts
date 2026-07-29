import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FeatureQuality } from '../entities/ai-feature-config.entity';

export class CreateFeatureConfigDto {
  @ApiProperty()
  @IsString()
  featureKey: string;

  @ApiProperty()
  @IsString()
  section: string;

  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: FeatureQuality, default: FeatureQuality.STANDARD })
  @IsOptional()
  @IsEnum(FeatureQuality)
  quality?: FeatureQuality;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiProperty({ required: false, default: 0.7 })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiProperty({ required: false, default: 2048 })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  rateLimitPerMinute?: number;

  @ApiProperty({ required: false, default: 1000 })
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

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

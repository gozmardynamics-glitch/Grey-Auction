import { IsString, IsOptional, IsBoolean, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProviderTier } from '../entities/llm-provider.entity';

export class UpdateProviderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiProperty({ required: false, enum: ProviderTier })
  @IsOptional()
  @IsEnum(ProviderTier)
  tier?: ProviderTier;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

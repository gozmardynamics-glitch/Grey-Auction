import { IsString, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModelDto {
  @ApiProperty()
  @IsString()
  modelId: string;

  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  capabilities?: string[];

  @ApiProperty({ required: false, default: 4096 })
  @IsOptional()
  @IsNumber()
  contextWindow?: number;

  @ApiProperty({ required: false, default: 2048 })
  @IsOptional()
  @IsNumber()
  maxOutputTokens?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  inputPricePerMillion?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  outputPricePerMillion?: number;

  @ApiProperty({ required: false, default: 0.7 })
  @IsOptional()
  @IsNumber()
  defaultTemperature?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

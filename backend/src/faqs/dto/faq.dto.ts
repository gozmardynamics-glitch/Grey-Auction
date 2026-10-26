import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * FAQ writes used to arrive as `@Body() dto: any` and go straight into
 * `repo.update(id, dto)` — an untyped mass-assignment on an admin route.
 */
export class CreateFaqDto {
  @ApiProperty({ example: 'general' })
  @IsString()
  @MaxLength(100)
  category: string;

  @ApiProperty({ example: 'How do I place a bid?' })
  @IsString()
  @MaxLength(500)
  question: string;

  @ApiProperty({ example: 'Open the lot and enter your bid...' })
  @IsString()
  @MaxLength(5000)
  answer: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateFaqDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  question?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  answer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

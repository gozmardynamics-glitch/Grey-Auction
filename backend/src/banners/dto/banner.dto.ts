import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Banner writes used to arrive as `@Body() dto: any` and go straight into
 * `repo.update(id, dto)` — an untyped mass-assignment on an admin route. The
 * shape is now explicit, so unknown fields are rejected by the global
 * validation pipe instead of being written to the row.
 */
export class CreateBannerDto {
  @ApiProperty({ example: 'Spring auction' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: '/uploads/banners/spring.webp' })
  @IsString()
  @MaxLength(500)
  imageUrl: string;

  @ApiPropertyOptional({ example: 'https://example.com/auctions' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  link?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ example: 'hero' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBannerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

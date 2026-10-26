import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Legal/content page writes used to arrive as `@Body() dto: any` and were
 * assigned straight onto the row.
 */
export class UpsertContentPageDto {
  @ApiPropertyOptional({ example: 'Terms & Conditions' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: '<p>…</p>' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;
}

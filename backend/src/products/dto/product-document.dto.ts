import { IsEnum, IsOptional, IsString, IsUrl, MaxLength, IsUUID, IsInt, Min, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductDocumentType } from '../entities/product-document.entity';

/**
 * Multipart submit of one lot document.
 *
 * The file itself is the `file` part; size, MIME type and stored URL are
 * derived server-side from the stored object, so a client can no longer claim
 * that an arbitrary third-party URL is a 2 MB PDF.
 */
export class UploadProductDocumentDto {
  @ApiProperty({ enum: ProductDocumentType, example: ProductDocumentType.INSPECTION_REPORT })
  @IsEnum(ProductDocumentType)
  documentType: ProductDocumentType;

  @ApiPropertyOptional({ example: 'Inspection Report' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Full mechanical inspection by certified mechanic' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateProductDocumentDto {
  @ApiPropertyOptional({ enum: ProductDocumentType })
  @IsOptional()
  @IsEnum(ProductDocumentType)
  documentType?: ProductDocumentType;

  @ApiPropertyOptional({ example: 'Inspection Report - Updated' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://s3.amazonaws.com/bucket/new-report.pdf' })
  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 'new-report.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({ example: 2048576 })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  fileSize?: number;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @ApiPropertyOptional({ example: 'sha256:abc123...' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  fileHash?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class VerifyProductDocumentDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED'], example: 'VERIFIED' })
  @IsEnum(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Document verified by admin' })
  @IsOptional()
  @IsString()
  notes?: string;
}
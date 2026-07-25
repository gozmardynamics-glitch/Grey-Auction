import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { DocumentType, DocumentVerificationStatus } from '../entities/seller-document.entity';

/**
 * DTO for uploading a document
 */
export class UploadDocumentDto {
  @ApiProperty({ enum: DocumentType, example: DocumentType.BUSINESS_LICENSE })
  @IsEnum(DocumentType)
  document_type: DocumentType;

  @ApiProperty({ example: 'BL123456', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  document_number?: string;

  @ApiProperty({ example: 'Business license for Tech Solutions Ltd', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @ApiProperty({ example: '2026-01-01', required: false })
  @IsOptional()
  @IsDateString()
  expires_at?: string;

  // Note: The actual file will be handled by multipart/form-data
  // This DTO is for metadata only
}

/**
 * DTO for verifying a document (admin)
 */
export class VerifyDocumentDto {
  @ApiProperty({
    enum: DocumentVerificationStatus,
    example: DocumentVerificationStatus.APPROVED,
  })
  @IsEnum(DocumentVerificationStatus)
  verification_status: DocumentVerificationStatus;

  @ApiProperty({ example: 'Document verified successfully', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  verification_notes?: string;

  @ApiProperty({
    example: 'Document is expired',
    required: false,
    description: 'Required when rejecting',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejection_reason?: string;
}

/**
 * DTO for updating document metadata
 */
export class UpdateDocumentDto {
  @ApiProperty({ example: 'BL123456', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  document_number?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @ApiProperty({ example: '2027-01-01', required: false })
  @IsOptional()
  @IsDateString()
  expires_at?: string;
}

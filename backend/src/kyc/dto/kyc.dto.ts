import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KycRequirementAudience } from '../entities/kyc-document-requirement.entity';
import { KycDocumentStatus } from '../entities/kyc-document.entity';

export class CreateKycRequirementDto {
  @ApiProperty({ example: 'national_id', description: 'Stable machine key' })
  @IsString()
  @Matches(/^[a-z0-9_]{3,64}$/, {
    message: 'code must be 3-64 chars of lowercase letters, digits or underscore',
  })
  code: string;

  @ApiProperty({ example: 'National ID Card' })
  @IsString()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional({ example: 'Front and back, clearly legible.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: KycRequirementAudience,
    default: KycRequirementAudience.BUYER,
  })
  @IsOptional()
  @IsEnum(KycRequirementAudience)
  audience?: KycRequirementAudience;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['application/pdf', 'image/jpeg', 'image/png'],
  })
  @IsOptional()
  allowedMimeTypes?: string[];

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSizeMb?: number;
}

export class UpdateKycRequirementDto {
  @ApiPropertyOptional({ example: 'National ID Card (front & back)' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: KycRequirementAudience })
  @IsOptional()
  @IsEnum(KycRequirementAudience)
  audience?: KycRequirementAudience;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  allowedMimeTypes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSizeMb?: number;
}

/**
 * Multipart submit of one KYC document.
 *
 * The file itself is the `file` part; everything about it (size, MIME type,
 * stored URL) is derived server-side from the stored object, so a client can no
 * longer assert that a third-party URL is an 8-byte PDF.
 */
export class UploadKycDocumentDto {
  @ApiProperty({ example: 'national_id', description: 'Requirement code' })
  @IsString()
  @Matches(/^[a-z0-9_]{3,64}$/, {
    message: 'requirementCode must be 3-64 chars of lowercase letters, digits or underscore',
  })
  requirementCode: string;

  @ApiPropertyOptional({ example: 'A01234567' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  documentNumber?: string;

  @ApiPropertyOptional({ example: '2030-01-31', description: 'Document expiry (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ReviewKycDocumentDto {
  @ApiProperty({ enum: [KycDocumentStatus.APPROVED, KycDocumentStatus.REJECTED] })
  @IsEnum([KycDocumentStatus.APPROVED, KycDocumentStatus.REJECTED])
  status: KycDocumentStatus.APPROVED | KycDocumentStatus.REJECTED;

  @ApiPropertyOptional({ example: 'Expiry date is not visible.' })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

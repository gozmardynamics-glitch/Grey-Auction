import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
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

export class SubmitKycDocumentDto {
  @ApiProperty({ example: 'national_id', description: 'Requirement code' })
  @IsString()
  requirementCode: string;

  @ApiProperty({ example: 'https://cdn.example.com/kyc/id-front.jpg' })
  @IsUrl()
  fileUrl: string;

  @ApiProperty({ example: 'id-front.jpg' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ example: 482133 })
  @IsInt()
  @Min(1)
  fileSize: number;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @MaxLength(100)
  mimeType: string;

  @ApiPropertyOptional({ example: 'A01234567' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  documentNumber?: string;

  @ApiPropertyOptional({ example: '2030-01-31' })
  @IsOptional()
  @IsString()
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

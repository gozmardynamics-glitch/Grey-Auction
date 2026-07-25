import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for approving a seller
 */
export class ApproveSellerDto {
  @ApiProperty({ example: 'All documents verified', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  verification_notes?: string;

  @ApiProperty({ example: 10.0, description: 'Commission rate (%)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commission_rate?: number;
}

/**
 * DTO for rejecting a seller
 */
export class RejectSellerDto {
  @ApiProperty({ example: 'Invalid business documents' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejection_reason: string;

  @ApiProperty({ example: 'Missing tax certificate', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  verification_notes?: string;
}

/**
 * DTO for suspending a seller
 */
export class SuspendSellerDto {
  @ApiProperty({ example: 'Policy violation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  suspension_reason: string;

  @ApiProperty({
    example: 'Seller violated terms by selling prohibited items',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internal_notes?: string;
}

/**
 * DTO for updating seller commission rate
 */
export class UpdateCommissionRateDto {
  @ApiProperty({ example: 8.5, description: 'New commission rate (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  commission_rate: number;

  @ApiProperty({ example: 'High-volume seller discount', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  Min,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { PayoutStatus } from '../entities/seller-payout.entity';

/**
 * DTO for requesting a payout
 */
export class RequestPayoutDto {
  @ApiProperty({ example: 50000.0, description: 'Amount to withdraw' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'NGN', required: false, default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    example: {
      bank_name: 'First Bank',
      account_number: '1234567890',
      account_name: 'Tech Solutions Ltd',
    },
    required: false,
    description: 'If different from default payout details',
  })
  @IsOptional()
  payout_details?: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    mobile_number?: string;
    wallet_address?: string;
    [key: string]: any;
  };

  @ApiProperty({ example: 'Monthly payout for January', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/**
 * DTO for processing a payout (admin)
 */
export class ProcessPayoutDto {
  @ApiProperty({ enum: PayoutStatus, example: PayoutStatus.COMPLETED })
  @IsEnum(PayoutStatus)
  status: PayoutStatus;

  @ApiProperty({ example: 'TXN123456789', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  transaction_id?: string;

  @ApiProperty({ example: 'Payment processed successfully', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  processing_notes?: string;

  @ApiProperty({
    example: 'Insufficient funds',
    required: false,
    description: 'Required when status is FAILED',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  failure_reason?: string;
}

/**
 * DTO for cancelling a payout
 */
export class CancelPayoutDto {
  @ApiProperty({ example: 'Requested by seller' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  cancellation_reason: string;
}

/**
 * DTO for querying payouts
 */
export class PayoutQueryDto {
  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 20, required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({ enum: PayoutStatus, required: false })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiProperty({ example: 'seller-id-here', required: false })
  @IsOptional()
  @IsString()
  seller_id?: string;
}

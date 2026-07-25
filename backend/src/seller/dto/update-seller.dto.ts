import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsUrl,
  Length,
  IsBoolean,
} from 'class-validator';
import { SellerBusinessType, SellerPayoutMethod } from '../entities/seller.entity';

/**
 * DTO for updating seller profile
 */
export class UpdateSellerDto {
  // ==========================================
  // Business Information
  // ==========================================
  @ApiProperty({ example: 'Tech Solutions Ltd', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  business_name?: string;

  @ApiProperty({ enum: SellerBusinessType, required: false })
  @IsOptional()
  @IsEnum(SellerBusinessType)
  business_type?: SellerBusinessType;

  @ApiProperty({ example: 'RC123456', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  business_registration_number?: string;

  @ApiProperty({ example: 'TIN123456789', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tax_id?: string;

  @ApiProperty({ example: 'Updated business description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  business_description?: string;

  // ==========================================
  // Contact Information
  // ==========================================
  @ApiProperty({ example: 'newemail@techsolutions.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+2348012345678', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be a valid international phone number',
  })
  phone?: string;

  @ApiProperty({ example: 'https://newtechsolutions.com', required: false })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  // ==========================================
  // Address
  // ==========================================
  @ApiProperty({ example: '456 New Street', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_line1?: string;

  @ApiProperty({ example: 'Suite 200', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_line2?: string;

  @ApiProperty({ example: 'Abuja', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ example: 'FCT', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiProperty({ example: '900001', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string;

  @ApiProperty({ example: 'NG', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  // ==========================================
  // Financial Information
  // ==========================================
  @ApiProperty({ enum: SellerPayoutMethod, required: false })
  @IsOptional()
  @IsEnum(SellerPayoutMethod)
  payout_method?: SellerPayoutMethod;

  @ApiProperty({
    example: {
      bank_name: 'First Bank',
      account_number: '1234567890',
      account_name: 'Tech Solutions Ltd',
    },
    required: false,
  })
  @IsOptional()
  bank_account_details?: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    routing_number?: string;
    swift_code?: string;
    iban?: string;
  };

  // ==========================================
  // Settings
  // ==========================================
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  notifications_enabled?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  auto_accept_orders?: boolean;

  @ApiProperty({
    example: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
    },
    required: false,
  })
  @IsOptional()
  business_hours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
}

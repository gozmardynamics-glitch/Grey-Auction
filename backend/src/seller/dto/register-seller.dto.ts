import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsUrl,
  Length,
} from 'class-validator';
import { SellerBusinessType, SellerPayoutMethod } from '../entities/seller.entity';

/**
 * DTO for seller registration
 */
export class RegisterSellerDto {
  // ==========================================
  // Business Information
  // ==========================================
  @ApiProperty({ example: 'Tech Solutions Ltd' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  business_name: string;

  @ApiProperty({ enum: SellerBusinessType, example: SellerBusinessType.LLC })
  @IsEnum(SellerBusinessType)
  business_type: SellerBusinessType;

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

  @ApiProperty({
    example: 'We sell high-quality tech products',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  business_description?: string;

  // ==========================================
  // Contact Information
  // ==========================================
  @ApiProperty({ example: 'seller@techsolutions.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be a valid international phone number',
  })
  phone: string;

  @ApiProperty({ example: 'https://techsolutions.com', required: false })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  // ==========================================
  // Address
  // ==========================================
  @ApiProperty({ example: '123 Tech Street' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address_line1: string;

  @ApiProperty({ example: 'Suite 100', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_line2?: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Lagos State' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @ApiProperty({ example: '100001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postal_code: string;

  @ApiProperty({ example: 'NG', description: 'ISO 3166-1 alpha-2 country code' })
  @IsString()
  @Length(2, 2)
  country: string;

  // ==========================================
  // Financial Information (Optional at registration)
  // ==========================================
  @ApiProperty({
    enum: SellerPayoutMethod,
    example: SellerPayoutMethod.BANK_TRANSFER,
    required: false,
  })
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
}

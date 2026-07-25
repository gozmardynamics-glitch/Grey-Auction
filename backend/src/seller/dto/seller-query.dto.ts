import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import {
  SellerBusinessType,
  SellerVerificationStatus,
  SellerStatus,
} from '../entities/seller.entity';

/**
 * DTO for querying sellers with filtering and pagination
 */
export class SellerQueryDto {
  // ==========================================
  // Pagination
  // ==========================================
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

  // ==========================================
  // Filters
  // ==========================================
  @ApiProperty({ enum: SellerVerificationStatus, required: false })
  @IsOptional()
  @IsEnum(SellerVerificationStatus)
  verification_status?: SellerVerificationStatus;

  @ApiProperty({ enum: SellerStatus, required: false })
  @IsOptional()
  @IsEnum(SellerStatus)
  status?: SellerStatus;

  @ApiProperty({ enum: SellerBusinessType, required: false })
  @IsOptional()
  @IsEnum(SellerBusinessType)
  business_type?: SellerBusinessType;

  @ApiProperty({ example: 'NG', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 'Lagos', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'tech', description: 'Search in business name', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 4.0, description: 'Minimum rating', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_rating?: number;

  // ==========================================
  // Sorting
  // ==========================================
  @ApiProperty({
    example: 'created_at',
    required: false,
    default: 'created_at',
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiProperty({
    example: 'DESC',
    required: false,
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC';
}

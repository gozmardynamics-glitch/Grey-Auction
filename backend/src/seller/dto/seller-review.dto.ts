import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
  IsArray,
  IsUrl,
} from 'class-validator';

/**
 * DTO for creating a seller review
 */
export class CreateReviewDto {
  @ApiProperty({ example: 5, description: 'Overall rating (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great seller!', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiProperty({ example: 'Excellent service and fast delivery' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  comment: string;

  @ApiProperty({ example: 'auction-id-here', required: false })
  @IsOptional()
  @IsString()
  auction_id?: string;

  @ApiProperty({ example: 'product-id-here', required: false })
  @IsOptional()
  @IsString()
  product_id?: string;

  // ==========================================
  // Sub-ratings (optional)
  // ==========================================
  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  communication_rating?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  product_quality_rating?: number;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  shipping_speed_rating?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  packaging_rating?: number;

  // ==========================================
  // Images (optional)
  // ==========================================
  @ApiProperty({
    example: ['https://example.com/image1.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}

/**
 * DTO for seller responding to a review
 */
export class RespondToReviewDto {
  @ApiProperty({ example: 'Thank you for your feedback!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  response: string;
}

/**
 * DTO for flagging a review (admin)
 */
export class FlagReviewDto {
  @ApiProperty({ example: 'Inappropriate language' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  flag_reason: string;
}

/**
 * DTO for querying reviews
 */
export class ReviewQueryDto {
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

  @ApiProperty({ example: 5, description: 'Filter by rating', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ example: 'seller-id-here', required: false })
  @IsOptional()
  @IsString()
  seller_id?: string;

  @ApiProperty({ example: 'bidder-id-here', required: false })
  @IsOptional()
  @IsString()
  bidder_id?: string;
}

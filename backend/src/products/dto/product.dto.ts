import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsDateString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus, AuctionType } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  startingBid: number;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subCategory?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  specifications?: Record<string, string>;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  reservePrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  buyNowPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasReservePrice?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  allowBuyNow?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  auctionDuration?: string;
}

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  startingBid?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  images?: string[];
}

export class ApproveProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectProductDto {
  @ApiProperty()
  @IsString()
  rejectionReason: string;
}

export class ProductQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiProperty({ required: false, enum: AuctionType })
  @IsOptional()
  @IsEnum(AuctionType)
  auctionType?: AuctionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  allowBuyNow?: boolean;
}

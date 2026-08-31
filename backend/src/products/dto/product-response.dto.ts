import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional() slug?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() startingBid: number;
  @ApiProperty() currentBid: number;
  @ApiProperty() category: string;
  @ApiProperty() endTime: string;
  @ApiProperty() totalBids: number;
  @ApiPropertyOptional() reservePrice?: number;
  @ApiPropertyOptional() buyNowPrice?: number;
  @ApiProperty() status: string;
  @ApiProperty() sellerId: string;
  @ApiPropertyOptional() images?: string[];
  @ApiPropertyOptional() createdAt?: string;
  @ApiPropertyOptional() updatedAt?: string;
}

export class ProductApiResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() message?: string;
  @ApiProperty({ type: ProductResponseDto }) data: ProductResponseDto;
}

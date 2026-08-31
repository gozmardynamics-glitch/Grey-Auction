import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BidResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiProperty() bidderId: string;
  @ApiProperty() amount: number;
  @ApiPropertyOptional() maxBid?: number;
  @ApiProperty() isAutoBid: boolean;
  @ApiProperty() isWinningBid: boolean;
  @ApiProperty() createdAt: string;
}

export class BidApiResponseDto {
  @ApiProperty() success: boolean;
  @ApiPropertyOptional() message?: string;
  @ApiProperty({ type: BidResponseDto }) data: BidResponseDto;
}

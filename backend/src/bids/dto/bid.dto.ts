import { IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaceBidDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  /**
   * Proxy/auto-bid ceiling. When set, the engine will keep this bidder in
   * the lead (placing incremental auto-bids) up to this maximum amount.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBid?: number;
}

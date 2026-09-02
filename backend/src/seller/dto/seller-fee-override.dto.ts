import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * U5 answer #1 — per-seller fee override payload (seller self-service).
 * Every field is optional; sending null clears the override (inherit).
 */
export class SellerFeeOverrideDto {
  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  buyerFeePct?: number | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  @IsOptional()
  @IsBoolean()
  buyerFeeEnabled?: boolean | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sellerFeePct?: number | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  @IsOptional()
  @IsBoolean()
  sellerFeeEnabled?: boolean | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatPct?: number | null;

  @ApiPropertyOptional({ enum: ['fees_only', 'hammer_and_fees'], nullable: true })
  @IsOptional()
  @IsIn(['fees_only', 'hammer_and_fees'])
  vatBase?: 'fees_only' | 'hammer_and_fees' | null;
}
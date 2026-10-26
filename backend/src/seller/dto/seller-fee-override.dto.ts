import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * U5 answer #1 + Decision 3a — what a seller may self-serve about fees.
 *
 * Platform commission is fixed by the admin: `buyerFeePct`, `sellerFeePct`,
 * `vatPct` and `vatBase` are platform revenue or statutory and are NOT
 * accepted here (the global ValidationPipe rejects them outright). A seller
 * may only toggle whether the buyer premium and the seller commission apply
 * to their lots. Percentages are set via the admin fee endpoints
 * (`PUT /fees`, `PUT /fees/overrides`).
 */
export class SellerFeeSelfServiceDto {
  @ApiPropertyOptional({ type: Boolean, nullable: true })
  @IsOptional()
  @IsBoolean()
  buyerFeeEnabled?: boolean | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  @IsOptional()
  @IsBoolean()
  sellerFeeEnabled?: boolean | null;
}

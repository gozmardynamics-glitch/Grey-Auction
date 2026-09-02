import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** U5 answer #3 — customizable payout schedule values (no fixed T+N). */
export const PAYOUT_FREQUENCIES = ['instant', 'daily', 'weekly', 'monthly'] as const;
export type PayoutFrequency = (typeof PAYOUT_FREQUENCIES)[number];

export class PayoutFrequencyDto {
  @ApiProperty({ enum: PAYOUT_FREQUENCIES, example: 'weekly' })
  @IsIn(PAYOUT_FREQUENCIES as unknown as string[])
  frequency: PayoutFrequency;
}
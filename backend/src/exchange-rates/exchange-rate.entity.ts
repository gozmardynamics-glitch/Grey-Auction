import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

export enum CurrencyCode {
  NGN = 'NGN',
  USD = 'USD',
  GHS = 'GHS',
  EUR = 'EUR',
}

/**
 * Exchange rate (L2 multi-currency). The "rate" column holds how many NGN one
 * unit of "code" costs (NGN is the base currency with rate 1). Seed values are
 * indicative and overridable; a live feed can be plugged via EXCHANGE_RATE_API_URL.
 */
@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryColumn({ type: 'varchar', length: 3 })
  code: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  rate: number;

  @UpdateDateColumn()
  updatedAt: Date;
}

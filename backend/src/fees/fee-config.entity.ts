import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('fee_configs')
@Index(['category'], { unique: true })
export class FeeConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 'default' = platform-wide fallback; otherwise category slug
  @Column({ default: 'default' })
  category: string;

  @Column({ type: 'varchar', length: 255, default: 'Platform Default' })
  displayName: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.0 })
  commissionPct: number; // Platform commission (buyer premium)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 7.5 })
  vatPct: number; // VAT rate applied to bid + commission

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  otherChargesPct: number; // Additional percentage-based charge

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  fixedFee: number; // Fixed charge applied per transaction

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Compute a full price breakdown for a bid amount.
   */
  calculateBreakdown(amount: number): {
    bidAmount: number;
    commission: number;
    vatOnBid: number;
    vatOnCommission: number;
    otherCharges: number;
    fixedFee: number;
    total: number;
  } {
    const commission = (amount * Number(this.commissionPct)) / 100;
    const vatOnBid = (amount * Number(this.vatPct)) / 100;
    const vatOnCommission = (commission * Number(this.vatPct)) / 100;
    const otherCharges = (amount * Number(this.otherChargesPct)) / 100;
    const fixedFee = Number(this.fixedFee) || 0;
    const total =
      amount + commission + vatOnBid + vatOnCommission + otherCharges + fixedFee;

    return {
      bidAmount: amount,
      commission,
      vatOnBid,
      vatOnCommission,
      otherCharges,
      fixedFee,
      total,
    };
  }
}

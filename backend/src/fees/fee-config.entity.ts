import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { VatBase } from './fee-breakdown';

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

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  commissionPct: number; // Buyer fee / buyer premium (U5 answer #1)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 7.5 })
  vatPct: number; // VAT rate

  // U5 answer #2 — VAT base switch: fees-only vs hammer+fees.
  @Column({ type: 'enum', enum: VatBase, enumName: 'fee_vat_base', default: VatBase.HAMMER_AND_FEES })
  vatBase: VatBase;

  // U5 answer #1 — seller commission 5% (platform default; adjustable/toggleable).
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  sellerCommissionPct: number;

  @Column({ default: true })
  buyerFeeEnabled: boolean;

  @Column({ default: true })
  sellerFeeEnabled: boolean;

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
   * Compute a full price breakdown for a bid amount (legacy single-config
   * version — the override-aware path lives in FeeService.resolveAndCompute).
   */
  calculateBreakdown(amount: number): {
    bidAmount: number;
    buyerFee: number;
    sellerFee: number;
    vatOnBid: number;
    vatOnBuyerFee: number;
    vatOnCommission: number; // legacy alias of vatOnBuyerFee
    otherCharges: number;
    fixedFee: number;
    total: number;
    sellerNet: number;
  } {
    const commission = (amount * Number(this.commissionPct)) / 100;
    const sellerFee = (amount * Number(this.sellerCommissionPct)) / 100;
    const vatOnBid =
      this.vatBase === VatBase.HAMMER_AND_FEES ? (amount * Number(this.vatPct)) / 100 : 0;
    const vatOnCommission = (commission * Number(this.vatPct)) / 100;
    const otherCharges = (amount * Number(this.otherChargesPct)) / 100;
    const fixedFee = Number(this.fixedFee) || 0;
    const total =
      amount + commission + vatOnBid + vatOnCommission + otherCharges + fixedFee;

    return {
      bidAmount: amount,
      buyerFee: commission,
      sellerFee,
      vatOnBid,
      vatOnBuyerFee: vatOnCommission,
      vatOnCommission,
      otherCharges,
      fixedFee,
      total,
      sellerNet: amount - sellerFee,
    };
  }
}

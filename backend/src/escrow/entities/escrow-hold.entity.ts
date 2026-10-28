import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

export enum EscrowStatus {
  HELD = 'held',
  DISPUTED = 'disputed',
  RELEASED = 'released',
  REFUNDED = 'refunded',
}

/**
 * Escrow hold (L5): the funds-in-escrow lifecycle for a paid invoice.
 *
 * The hold records the buyer's **full bill** and its split, so the money that
 * leaves escrow is a stored fact rather than a recomputation:
 *
 *   amount        (buyerTotal)  what the buyer actually paid
 *   sellerNet                   what the seller receives  = hammer − sellerFee
 *   platformShare               commission + fees + other = the platform's revenue
 *   vatAmount                   VAT, which belongs to neither party
 *
 * On release the seller is credited `sellerNet` only. Paying `amount` to the
 * seller (the previous behaviour) handed them the buyer's premium and the VAT,
 * and silently dropped the platform's entire commission.
 */
@Entity('escrow_holds')
@Index(['invoiceId'])
@Index(['buyerId'])
@Index(['sellerId'])
// One open hold per invoice. `SELECT … FOR UPDATE` locks nothing when the row
// is absent, so a partial unique index is the only thing that stops two
// concurrent settlements creating two holds that both release.
@Index('UQ_escrow_open_per_invoice', ['invoiceId'], {
  unique: true,
  where: `"status" IN ('held', 'disputed')`,
})
export class EscrowHold {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  invoiceId: string;

  /** The buyer's gross bill for this invoice. */
  @Column({ type: 'decimal', precision: 18, scale: 2, transformer: decimalTransformer })
  amount: number;

  /** What the seller receives on release: hammer − seller fee. */
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0, transformer: decimalTransformer })
  sellerNet: number;

  /** Platform revenue held in this escrow: buyer premium + seller fee + fees. */
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0, transformer: decimalTransformer })
  platformShare: number;

  /** VAT component; remitted by the platform, paid to neither party. */
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0, transformer: decimalTransformer })
  vatAmount: number;

  @Column({ type: 'uuid' })
  buyerId: string;

  @Column({ type: 'uuid' })
  sellerId: string;

  @Column({ type: 'enum', enum: EscrowStatus, default: EscrowStatus.HELD })
  status: EscrowStatus;

  @Column({ type: 'text', nullable: true })
  refundReason: string;

  /**
   * How much of this hold has already been refunded to the buyer, and how that
   * was split across the components. A partial refund is a *reduction of the
   * bill*, not a closure: the hold stays open with the remaining amounts so the
   * rest can still be released to the seller. `amount` is always the remainder,
   * so `sellerNet + platformShare + vatAmount === amount` keeps holding.
   */
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0, transformer: decimalTransformer })
  refundedAmount: number;

  @Column({ type: 'jsonb', default: '[]' })
  refundBreakdown: Array<{
    amount: number;
    sellerNet: number;
    platformShare: number;
    vat: number;
    reason: string;
    at: string;
    by: string;
  }>;

  @Column({ type: 'uuid', nullable: true })
  resolvedById: string;

  @Column({ type: 'timestamp', nullable: true })
  releasedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  // U5 answer #4 — when this hold auto-releases to the seller
  // (fixed from the lot's escrowReleaseHours at auction creation).
  @Column({ type: 'timestamp', nullable: true })
  autoReleaseAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

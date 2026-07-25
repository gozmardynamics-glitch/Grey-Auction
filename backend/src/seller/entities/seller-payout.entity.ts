import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Seller } from './seller.entity';

/**
 * Payout Status
 */
export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
}

/**
 * SellerPayout Entity
 * Tracks payment payouts to sellers
 */
@Entity('seller_payouts')
@Index(['seller_id'])
@Index(['status'])
@Index(['reference_number'], { unique: true })
@Index(['requested_at'])
@Index(['completed_at'])
export class SellerPayout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==========================================
  // Seller Reference
  // ==========================================
  @Column({ type: 'uuid' })
  seller_id: string;

  @ManyToOne(() => Seller)
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  // ==========================================
  // Amount Information
  // ==========================================
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  gross_amount: number; // Total sales amount

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  commission_amount: number; // Platform commission

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  net_amount: number; // Amount to be paid out

  @Column({ type: 'varchar', length: 3, default: 'NGN' })
  currency: string; // ISO 4217

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  commission_rate: number; // Rate at time of payout

  // ==========================================
  // Payout Details
  // ==========================================
  @Column({
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.PENDING,
  })
  status: PayoutStatus;

  @Column({ type: 'varchar', length: 50 })
  payout_method: string; // BANK_TRANSFER, MOBILE_MONEY, etc.

  @Column({ type: 'jsonb' })
  payout_details: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    mobile_number?: string;
    wallet_address?: string;
    [key: string]: any;
  };

  @Column({ type: 'varchar', length: 100, unique: true })
  reference_number: string; // Unique payout reference

  @Column({ type: 'varchar', length: 255, nullable: true })
  transaction_id: string; // External payment gateway transaction ID

  // ==========================================
  // Period Covered
  // ==========================================
  @Column({ type: 'date', nullable: true })
  period_start: Date; // Start of sales period

  @Column({ type: 'date', nullable: true })
  period_end: Date; // End of sales period

  @Column({ type: 'int', default: 0 })
  orders_count: number; // Number of orders in this payout

  // ==========================================
  // Processing Information
  // ==========================================
  @Column({ type: 'uuid', nullable: true })
  processed_by_id: string; // Admin who processed

  @Column({ type: 'text', nullable: true })
  processing_notes: string;

  @Column({ type: 'text', nullable: true })
  failure_reason: string;

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  // ==========================================
  // Timestamps
  // ==========================================
  @CreateDateColumn({ type: 'timestamp with time zone' })
  requested_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approved_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processing_started_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completed_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  failed_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelled_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // ==========================================
  // Metadata
  // ==========================================
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // ==========================================
  // Computed Properties
  // ==========================================
  get is_pending(): boolean {
    return this.status === PayoutStatus.PENDING;
  }

  get is_processing(): boolean {
    return this.status === PayoutStatus.PROCESSING;
  }

  get is_completed(): boolean {
    return this.status === PayoutStatus.COMPLETED;
  }

  get is_failed(): boolean {
    return this.status === PayoutStatus.FAILED;
  }

  get can_retry(): boolean {
    return this.is_failed && this.retry_count < 3;
  }

  get processing_time_hours(): number | null {
    if (!this.processing_started_at || !this.completed_at) {
      return null;
    }
    const diff = this.completed_at.getTime() - this.processing_started_at.getTime();
    return diff / (1000 * 60 * 60);
  }

  // ==========================================
  // Helper Methods
  // ==========================================
  
  /**
   * Generate unique reference number
   */
  static generateReferenceNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PO-${timestamp}-${random}`;
  }

  /**
   * Calculate commission
   */
  static calculateCommission(grossAmount: number, rate: number): number {
    return (grossAmount * rate) / 100;
  }

  /**
   * Calculate net amount
   */
  static calculateNetAmount(grossAmount: number, commissionRate: number): number {
    const commission = SellerPayout.calculateCommission(grossAmount, commissionRate);
    return grossAmount - commission;
  }
}

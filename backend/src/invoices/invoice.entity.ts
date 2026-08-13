import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Invoice Status
 */
export enum InvoiceStatus {
  ISSUED = 'issued',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

/**
 * Invoice Entity
 * Represents an invoice issued to a winning bidder after an auction closes.
 */
@Entity('invoices')
@Index(['invoice_number'], { unique: true })
@Index(['buyer_id'])
@Index(['seller_id'])
@Index(['auction_id'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==========================================
  // Reference
  // ==========================================
  @Column({ type: 'varchar', length: 50, unique: true })
  invoice_number: string;

  @Column({ type: 'uuid' })
  auction_id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'uuid' })
  buyer_id: string;

  @Column({ type: 'uuid' })
  seller_id: string;

  // ==========================================
  // Amounts
  // ==========================================
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  hammer_price: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  commission: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  vat: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  fixed_fee: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  total: number;

  // ==========================================
  // Status & Payment
  // ==========================================
  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.ISSUED })
  status: InvoiceStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  issued_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  payment_reference: string;

  @Column({ type: 'text', nullable: true })
  payment_status_note: string;

  // ==========================================
  // Timestamps
  // ==========================================
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}

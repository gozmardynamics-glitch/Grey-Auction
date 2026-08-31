import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

/**
 * A buyer's order for a won lot, derived from (and linked to) an invoice.
 * Created on checkout and flipped to PAID by the payment webhook seam.
 */
@Entity('orders')
@Index(['buyerId'])
@Index(['sellerId'])
@Index(['invoiceId'], { unique: true })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  invoiceId: string;

  @Column({ type: 'uuid', nullable: true })
  auctionId: string;

  @Column({ type: 'uuid', nullable: true })
  productId: string;

  @Column({ type: 'uuid' })
  buyerId: string;

  @Column({ type: 'uuid' })
  sellerId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentReference: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

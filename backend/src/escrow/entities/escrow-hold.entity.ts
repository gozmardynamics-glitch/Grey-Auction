import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum EscrowStatus {
  HELD = 'held',
  DISPUTED = 'disputed',
  RELEASED = 'released',
  REFUNDED = 'refunded',
}

/**
 * Escrow hold (L5): the funds-in-escrow lifecycle for a paid invoice.
 *
 * This is the state-machine seam only - it records the hold and its
 * transitions. When a real payment gateway is configured, release/refund hook
 * into the payout/disbursement provider (see the payments module).
 */
@Entity('escrow_holds')
@Index(['invoiceId'])
@Index(['buyerId'])
@Index(['sellerId'])
export class EscrowHold {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'uuid' })
  buyerId: string;

  @Column({ type: 'uuid' })
  sellerId: string;

  @Column({ type: 'enum', enum: EscrowStatus, default: EscrowStatus.HELD })
  status: EscrowStatus;

  @Column({ type: 'text', nullable: true })
  refundReason: string;

  @Column({ type: 'uuid', nullable: true })
  resolvedById: string;

  @Column({ type: 'timestamp', nullable: true })
  releasedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

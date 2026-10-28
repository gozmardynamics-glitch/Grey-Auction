import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum WalletTransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  ESCROW_RELEASE = 'escrow_release',
  ESCROW_REFUND = 'escrow_refund',
  /** Manual credit: a goodwill payment or a remedy agreed while handling a
   *  complaint. Always carries a reference and an admin author. */
  ADJUSTMENT = 'adjustment',
}

export enum WalletTransactionStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed',
}

@Entity('wallet_transactions')
@Index(['walletId'])
@Index(['reference'], { unique: true })
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  walletId: string;

  @Column({ type: 'enum', enum: WalletTransactionType })
  type: WalletTransactionType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: WalletTransactionStatus, default: WalletTransactionStatus.COMPLETED })
  status: WalletTransactionStatus;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  balanceAfter: number;

  @CreateDateColumn()
  createdAt: Date;
}

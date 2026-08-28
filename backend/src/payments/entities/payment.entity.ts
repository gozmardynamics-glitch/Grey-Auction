import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PaymentType {
  INVOICE = 'invoice',
  DEPOSIT = 'deposit',
}

export enum PaymentProvider {
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
  INTERSWITCH = 'interswitch',
  OPAY = 'opay',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * A first-class payment record. Provider webhooks reconcile and update the
 * matching row by reference, so retries and partial failures are idempotent.
 * type decides whether a succeeded payment credits a wallet (deposit) or
 * marks an invoice paid (invoice). reference is the app's unique txn ref,
 * which is mirrored to the provider (tx_ref / reference).
 */
@Entity('payments')
@Index(['reference'], { unique: true })
@Index(['userId'])
@Index(['invoiceId'])
@Index(['provider', 'providerReference'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  invoiceId: string | null;

  @Column({ type: 'enum', enum: PaymentType })
  type: PaymentType;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider: PaymentProvider;

  /** The app's unique transaction reference (used as the gateway tx_ref/reference). */
  @Column({ length: 255 })
  reference: string;

  /** The provider's own transaction reference (set on verification/webhook). */
  @Column({ length: 255, nullable: true })
  providerReference: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'NGN' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

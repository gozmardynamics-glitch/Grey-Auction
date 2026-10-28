import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DisputeReason {
  NOT_AS_DESCRIBED = 'not_as_described',
  NON_DELIVERY = 'non_delivery',
  PAYMENT_ISSUE = 'payment_issue',
  CONDUCT = 'conduct',
  OTHER = 'other',
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

/**
 * Dispute (L4 trust & safety): a buyer (or seller) raises a case against a
 * transaction; admins review and close it; both parties then leave feedback.
 */
@Entity('disputes')
@Index(['openedById'])
@Index(['status'])
@Index(['productId'])
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  openedById: string;

  @Column({ type: 'uuid', nullable: true })
  againstUserId: string;

  @Column({ type: 'uuid', nullable: true })
  productId: string;

  @Column({ type: 'uuid', nullable: true })
  invoiceId: string;

  @Column({ type: 'enum', enum: DisputeReason })
  reason: DisputeReason;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.OPEN })
  status: DisputeStatus;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'uuid', nullable: true })
  resolvedById: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  /**
   * One appeal per dispute. A decision a party disagrees with can be reviewed
   * once by a different administrator — the Complaints Policy promises an
   * internal review, and without this a decided dispute had no next step except
   * the regulator.
   */
  @Column({ type: 'int', default: 0 })
  appealCount: number;

  @Column({ type: 'timestamp', nullable: true })
  appealedAt: Date;

  @Column({ type: 'text', nullable: true })
  appealReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** Post-dispute feedback from either party (the "feedback loop"). */
@Entity('dispute_feedback')
@Index(['disputeId'])
@Index(['disputeId', 'userId'], { unique: true })
export class DisputeFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  disputeId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'int' })
  rating: number; // 1..5

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}

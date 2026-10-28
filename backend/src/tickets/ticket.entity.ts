import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

/**
 * What the complaint is about.
 *
 * Drives severity (and therefore the service level) and is the dimension the
 * monthly complaints report is built on. It exists because triage used to depend
 * on reading every message: the ticket table had no way to say "this is about a
 * withheld payout".
 */
export enum TicketCategory {
  BIDDING = 'bidding',
  PAYMENTS = 'payments',
  ESCROW = 'escrow',
  PAYOUTS = 'payouts',
  LISTING = 'listing',
  DELIVERY = 'delivery',
  ACCOUNT = 'account',
  DATA_PROTECTION = 'data_protection',
  OTHER = 'other',
}

/** P1 is money or safety; P4 is feedback that needs no reply beyond the answer. */
export enum TicketSeverity {
  P1 = 'p1',
  P2 = 'p2',
  P3 = 'p3',
  P4 = 'p4',
}

/** How the complaint ended, for reporting and for fairness review. */
export enum TicketOutcome {
  UPHELD = 'upheld',
  PARTIALLY_UPHELD = 'partially_upheld',
  NOT_UPHELD = 'not_upheld',
  WITHDRAWN = 'withdrawn',
  REFERRED = 'referred',
}

/** Why a ticket was closed without being resolved on its merits. */
export enum TicketClosureReason {
  RESOLVED = 'resolved',
  VEXATIOUS = 'vexatious',
  UNREASONABLE_CONDUCT = 'unreasonable_conduct',
  DUPLICATE = 'duplicate',
  NO_RESPONSE = 'no_response',
  OTHER = 'other',
}

export enum TicketSource {
  CONTACT_FORM = 'contact_form',
  DASHBOARD = 'dashboard',
  ADMIN = 'admin',
}

export interface TicketMessage {
  senderId: string;
  content: string;
  timestamp: string;
  /** True when the message came from staff rather than the account holder. */
  staff?: boolean;
}

@Entity('tickets')
@Index(['dueAt'])
@Index(['severity'])
@Index(['category'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Human reference quoted to the complainant, e.g. TKT-2026-000042. */
  @Column({ type: 'varchar', length: 24, unique: true, nullable: true })
  reference: string;

  @Column()
  subject: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: 'enum', enum: TicketCategory, default: TicketCategory.OTHER })
  category: TicketCategory;

  @Column({ type: 'enum', enum: TicketSeverity, default: TicketSeverity.P3 })
  severity: TicketSeverity;

  @Column({ type: 'enum', enum: TicketSource, default: TicketSource.DASHBOARD })
  source: TicketSource;

  // ─── Service level clocks ────────────────────────────────────────────────
  /** When we confirmed receipt to the complainant. */
  @Column({ type: 'timestamptz', nullable: true })
  acknowledgedAt: Date;

  /** First reply from staff — the second clock in the policy. */
  @Column({ type: 'timestamptz', nullable: true })
  firstResponseAt: Date;

  /** Resolution deadline, derived from severity in business days. */
  @Column({ type: 'timestamptz', nullable: true })
  dueAt: Date;

  /** Set once a proactive "we are still working on it" notice has gone out. */
  @Column({ type: 'timestamptz', nullable: true })
  slaNotifiedAt: Date;

  // ─── Handling ────────────────────────────────────────────────────────────
  @Column({ type: 'uuid', nullable: true })
  firstResponderId: string;

  /** Internal review (escalation). Never the first responder — see docs. */
  @Column({ type: 'timestamptz', nullable: true })
  escalatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  escalatedToId: string;

  @Column({ type: 'enum', enum: TicketOutcome, nullable: true })
  outcome: TicketOutcome;

  @Column({ type: 'enum', enum: TicketClosureReason, nullable: true })
  closureReason: TicketClosureReason;

  @Column({ type: 'text', nullable: true })
  resolutionNote: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  userName: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ type: 'jsonb', default: '[]' })
  messages: TicketMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

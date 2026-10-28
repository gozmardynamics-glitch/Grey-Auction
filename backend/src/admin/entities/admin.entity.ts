import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  PLATFORM_ADMIN = 'platform_admin',
  SUPPORT_ADMIN = 'support_admin',
  FINANCE_ADMIN = 'finance_admin',
}

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  // The admins row that carries authority MUST be linked to the users row that
  // authenticates. Email-string matching (the old scheme) let any user who
  // set their users.email to an admin address inherit that admin's power.
  // Unique + nullable: legacy rows backfill via the seed script; null means
  // "no JWT authority yet".
  @Column({ type: 'uuid', nullable: true })
  @Index('UQ_admin_user', ['userId'], { unique: true })
  userId: string | null;

  @Column({
    type: 'enum',
    enum: AdminRole,
    default: AdminRole.PLATFORM_ADMIN,
  })
  role: AdminRole;

  @Column({ default: true })
  isActive: boolean;

  // ── Second factor ────────────────────────────────────────────────
  /**
   * Administrators can refund escrow, credit wallets and release holds, so a
   * password alone is not enough authority. The secret is stored encrypted
   * (AES-256-GCM, see AdminMfaService) — never in the clear, never logged.
   */
  @Column({ type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  mfaSecret: string | null;

  /** SHA-256 hashes of single-use recovery codes; the codes themselves are
   *  shown once, at enrolment, and never stored. */
  @Column({ type: 'jsonb', default: '[]' })
  mfaRecoveryCodes: Array<{ hash: string; usedAt: string | null }>;

  @Column({ type: 'timestamp', nullable: true })
  mfaEnrolledAt: Date | null;

  /** Brute-force guard: consecutive bad codes, and the lockout they trigger. */
  @Column({ type: 'int', default: 0 })
  mfaFailedAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  mfaLockedUntil: Date | null;

  /** Highest TOTP counter already accepted — a code can never be reused. */
  @Column({ type: 'bigint', nullable: true })
  mfaLastStep: string | null;

  /** When this admin last proved a second factor; drives step-up windows. */
  @Column({ type: 'timestamp', nullable: true })
  lastMfaAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

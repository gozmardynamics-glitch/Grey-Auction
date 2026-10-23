import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum KycRequirementAudience {
  BUYER = 'buyer',
  SELLER = 'seller',
  BOTH = 'both',
}

/**
 * A KYC document the platform asks an account holder to provide.
 *
 * Defined by an admin rather than hardcoded, so the required paperwork can be
 * changed per jurisdiction or policy without a deploy: the admin names the
 * document, says who it applies to, and whether it is mandatory.
 */
@Entity('kyc_document_requirements')
@Index(['code'], { unique: true })
@Index(['audience'])
@Index(['isActive'])
export class KycDocumentRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stable machine key, e.g. `national_id`. Admin-supplied. */
  @Column({ type: 'varchar', length: 64 })
  code: string;

  /** Human-facing name shown to the account holder and in the review queue. */
  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: KycRequirementAudience,
    default: KycRequirementAudience.BUYER,
  })
  audience: KycRequirementAudience;

  /** Mandatory documents gate "verified" status; optional ones do not. */
  @Column({ default: true })
  isRequired: boolean;

  /** Soft switch: inactive requirements stay for history but stop being asked. */
  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  /** Accepted MIME types; empty means any. */
  @Column('simple-array', { nullable: true })
  allowedMimeTypes: string[];

  @Column({ type: 'int', default: 10 })
  maxSizeMb: number;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}

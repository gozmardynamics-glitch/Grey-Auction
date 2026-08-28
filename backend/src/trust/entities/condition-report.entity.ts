import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum LotCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  USED = 'used',
  REFURBISHED = 'refurbished',
  DAMAGED = 'damaged',
  NOT_TESTED = 'not_tested',
}

/** A = excellent … E = poor / heavy wear (Troostwijk-style grading). */
export enum ConditionGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
}

export interface ConditionDefect {
  part: string;
  severity: 'minor' | 'major' | 'critical';
  description: string;
}

/**
 * Condition report (L4 trust & safety): an inspection record attached to a
 * lot. Sellers (or admins) file reports; buyers read them on the listing.
 * The newest report is the current one — history is kept for disputes.
 */
@Entity('condition_reports')
@Index(['productId'])
@Index(['createdAt'])
export class ConditionReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'enum', enum: LotCondition })
  condition: LotCondition;

  @Column({ type: 'enum', enum: ConditionGrade })
  grade: ConditionGrade;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  defects: ConditionDefect[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  inspectedAtLocation: string;

  /** User id of the seller/admin who filed the report. */
  @Column({ type: 'uuid', nullable: true })
  reportedById: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  reporterName: string;

  @CreateDateColumn()
  createdAt: Date;
}

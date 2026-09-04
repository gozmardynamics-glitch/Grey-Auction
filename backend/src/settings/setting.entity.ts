import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Platform settings persisted as JSON documents keyed by section
 * (e.g. "general"). Replaces the audit-flagged in-memory-only store whose
 * DB branch returned {} — settings now survive restarts and multiple
 * instances see the same values.
 */
@Entity('settings')
export class Setting {
  /** Section key: "general", "payments", ... */
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key: string;

  /** Arbitrary JSON payload for the section. */
  @Column({ type: 'jsonb', nullable: true })
  value: unknown;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}

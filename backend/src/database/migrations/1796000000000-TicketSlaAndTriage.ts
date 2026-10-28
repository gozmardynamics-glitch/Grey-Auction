import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Complaint triage and service levels on tickets.
 *
 * A ticket used to be a subject and a status: no category (so nothing could be
 * triaged or reported by area) and no deadline (so the published "acknowledge in
 * 2 business days, resolve in 10" could not be monitored). This adds the
 * classification, the two clocks, the internal-review tier and the outcome, so
 * the Complaints Policy describes a process that actually runs.
 *
 * Written with IF NOT EXISTS throughout: dev databases already have these via
 * synchronize, and re-running must not fail.
 */
export class TicketSlaAndTriage1796000000000 implements MigrationInterface {
  name = 'TicketSlaAndTriage1796000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [typeName, values] of [
      ['tickets_category_enum', ['bidding', 'payments', 'escrow', 'payouts', 'listing', 'delivery', 'account', 'data_protection', 'other']],
      ['tickets_severity_enum', ['p1', 'p2', 'p3', 'p4']],
      ['tickets_outcome_enum', ['upheld', 'partially_upheld', 'not_upheld', 'withdrawn', 'referred']],
      ['tickets_closure_reason_enum', ['resolved', 'vexatious', 'unreasonable_conduct', 'duplicate', 'no_response', 'other']],
      ['tickets_source_enum', ['contact_form', 'dashboard', 'admin']],
    ] as const) {
      const literal = values.map((value) => `'${value}'`).join(', ');
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${typeName}') THEN
            CREATE TYPE "${typeName}" AS ENUM (${literal});
          END IF;
        END
        $$;`);
    }

    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "reference" varchar(24)`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "category" "tickets_category_enum" NOT NULL DEFAULT 'other'`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "severity" "tickets_severity_enum" NOT NULL DEFAULT 'p3'`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "source" "tickets_source_enum" NOT NULL DEFAULT 'dashboard'`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "acknowledgedAt" timestamptz`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "firstResponseAt" timestamptz`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "dueAt" timestamptz`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "slaNotifiedAt" timestamptz`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "firstResponderId" uuid`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "escalatedAt" timestamptz`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "escalatedToId" uuid`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "outcome" "tickets_outcome_enum"`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "closureReason" "tickets_closure_reason_enum"`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "resolutionNote" text`);

    // References must be unique; a partial index keeps legacy rows (null) valid.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE tablename = 'tickets' AND indexname = 'UQ_tickets_reference'
        ) THEN
          CREATE UNIQUE INDEX "UQ_tickets_reference" ON "tickets" ("reference") WHERE "reference" IS NOT NULL;
        END IF;
      END
      $$;`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tickets_dueAt" ON "tickets" ("dueAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tickets_severity" ON "tickets" ("severity")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tickets_category" ON "tickets" ("category")`);

    // Existing rows get a deadline so the queue is not full of untracked tickets.
    // P3/P4 default to 15 business days from creation.
    await queryRunner.query(`
      UPDATE "tickets"
      SET "dueAt" = "createdAt" + interval '21 days',
          "acknowledgedAt" = COALESCE("acknowledgedAt", "createdAt")
      WHERE "dueAt" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_severity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_dueAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_tickets_reference"`);

    for (const column of [
      'resolutionNote', 'closureReason', 'outcome', 'escalatedToId', 'escalatedAt',
      'firstResponderId', 'slaNotifiedAt', 'dueAt', 'firstResponseAt', 'acknowledgedAt',
      'source', 'severity', 'category', 'reference',
    ]) {
      await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN IF EXISTS "${column}"`);
    }

    for (const typeName of [
      'tickets_source_enum', 'tickets_closure_reason_enum', 'tickets_outcome_enum',
      'tickets_severity_enum', 'tickets_category_enum',
    ]) {
      await queryRunner.query(`DROP TYPE IF EXISTS "${typeName}"`);
    }
  }
}

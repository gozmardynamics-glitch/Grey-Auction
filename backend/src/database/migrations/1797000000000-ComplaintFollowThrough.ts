import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Complaint follow-through: partial refunds, goodwill credits, dispute appeals.
 *
 * These close the remedies and escalation steps the Complaints Policy implies but
 * the platform could not perform: a dispute could only be settled all-or-nothing,
 * a goodwill payment needed database access, a decided dispute had no review
 * step, and a flagged review had nowhere to be seen.
 *
 * Idempotent (IF NOT EXISTS / guarded enum add) because dev databases already
 * have most of this through synchronize.
 */
export class ComplaintFollowThrough1797000000000 implements MigrationInterface {
  name = 'ComplaintFollowThrough1797000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── wallet ledger: a type for discretionary credits ────────────────────
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'wallet_transactions_type_enum' AND e.enumlabel = 'adjustment'
        ) THEN
          ALTER TYPE "wallet_transactions_type_enum" ADD VALUE IF NOT EXISTS 'adjustment';
        END IF;
      END
      $$;`);

    // ── escrow holds: what has already gone back to the buyer ──────────────
    await queryRunner.query(
      `ALTER TABLE "escrow_holds" ADD COLUMN IF NOT EXISTS "refundedAmount" numeric(18,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "escrow_holds" ADD COLUMN IF NOT EXISTS "refundBreakdown" jsonb NOT NULL DEFAULT '[]'`,
    );

    // ── disputes: one appeal ───────────────────────────────────────────────
    await queryRunner.query(
      `ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "appealCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "appealedAt" timestamp`);
    await queryRunner.query(`ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "appealReason" text`);

    // ── reviews: the reporter is a user, so the flag needs an index ────────
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_seller_reviews_status" ON "seller_reviews" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_seller_reviews_status"`);
    await queryRunner.query(`ALTER TABLE "disputes" DROP COLUMN IF EXISTS "appealReason"`);
    await queryRunner.query(`ALTER TABLE "disputes" DROP COLUMN IF EXISTS "appealedAt"`);
    await queryRunner.query(`ALTER TABLE "disputes" DROP COLUMN IF EXISTS "appealCount"`);
    await queryRunner.query(`ALTER TABLE "escrow_holds" DROP COLUMN IF EXISTS "refundBreakdown"`);
    await queryRunner.query(`ALTER TABLE "escrow_holds" DROP COLUMN IF EXISTS "refundedAmount"`);
    // Enum values are not removed: doing so would require rewriting existing rows.
  }
}

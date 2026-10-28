import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reporting a review is a request for moderation, not an act of moderation.
 *
 * It used to be neither: `POST /sellers/reviews/:id/report` set the review to
 * FLAGGED, and both the rating average and the public review list only count
 * ACTIVE — so any signed-in user could erase a review from a seller's public
 * record simply by reporting it. There was no limit, no dedupe and no record of
 * who had reported what.
 *
 * Three changes here:
 *   1. New columns count and attribute reports without touching `status`.
 *   2. FLAGGED is no longer written by any code path, so every FLAGGED row is a
 *      leftover from the old behaviour — it is put back to ACTIVE. Admins who
 *      meant to suppress something have HIDDEN and REMOVED for that, and those
 *      are untouched.
 *   3. Reviews carry the report counter forward so the moderation queue can be
 *      ordered by how many independent people complained.
 */
export class ReviewReportIntegrity1799000000000 implements MigrationInterface {
  name = 'ReviewReportIntegrity1799000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "seller_reviews" ADD COLUMN IF NOT EXISTS "report_count" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_reviews" ADD COLUMN IF NOT EXISTS "reporters" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_reviews" ADD COLUMN IF NOT EXISTS "report_resolved_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_reviews" ADD COLUMN IF NOT EXISTS "report_resolution" character varying(40)`,
    );

    // Restore reviews that were hidden by nothing more than a report.
    await queryRunner.query(
      `UPDATE "seller_reviews" SET "status" = 'ACTIVE' WHERE "status" = 'FLAGGED'`,
    );

    // Existing reports keep their reason so they stay in the queue, and are
    // counted as one report from the recorded reporter.
    await queryRunner.query(
      `UPDATE "seller_reviews"
          SET "report_count" = 1,
              "reporters" = CASE
                WHEN "flagged_by_id" IS NULL THEN '[]'::jsonb
                ELSE to_jsonb(ARRAY["flagged_by_id"::text])
              END
        WHERE "flag_reason" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "seller_reviews" DROP COLUMN IF EXISTS "report_resolution"`);
    await queryRunner.query(`ALTER TABLE "seller_reviews" DROP COLUMN IF EXISTS "report_resolved_at"`);
    await queryRunner.query(`ALTER TABLE "seller_reviews" DROP COLUMN IF EXISTS "reporters"`);
    await queryRunner.query(`ALTER TABLE "seller_reviews" DROP COLUMN IF EXISTS "report_count"`);
  }
}

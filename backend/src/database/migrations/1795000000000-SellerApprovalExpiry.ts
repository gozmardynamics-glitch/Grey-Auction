import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Decision 3b follow-up: the approval window.
 *
 * `products.approvalRequestedAt` records when settlement parked a lot in
 * awaiting_seller_approval. Without it the expiry sweep has no clock, and a lot
 * whose seller never answered waits forever — the winning bidder hears nothing
 * and the lot can never be invoiced or relisted.
 *
 * Backfill: any lot already parked gets its `updatedAt`, which is when the
 * status flip happened, so existing rows expire on the normal schedule instead
 * of needing a manual sweep.
 */
export class SellerApprovalExpiry1795000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "approvalRequestedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(`UPDATE "products"
      SET "approvalRequestedAt" = "updatedAt"
      WHERE "status" = 'awaiting_seller_approval'
        AND "approvalRequestedAt" IS NULL`);
    // The sweep filters on exactly this pair.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_products_awaiting_approval"
        ON "products" ("approvalRequestedAt")
        WHERE "status" = 'awaiting_seller_approval'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_awaiting_approval"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "approvalRequestedAt"`,
    );
  }
}

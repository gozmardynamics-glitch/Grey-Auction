import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Money-split backfill + full-text search index (2026-10-24).
 *
 * Catches production up with what dev's synchronize has already applied, and
 * repairs the historical rows the split columns were added after:
 *
 *  1. invoices.seller_net / platform_share / other_charges — rows created
 *     before the columns existed carry seller_net = 0, which would pay the
 *     seller nothing on release.
 *  2. escrow_holds.sellerNet / platformShare / vatAmount — copy the (now
 *     correct) invoice split onto holds that predate it. Already-released
 *     holds were overpaid gross; correcting the row does not claw money back —
 *     that remains a business decision.
 *  3. Partial unique indexes (one live payment per invoice, one open escrow
 *     hold per invoice) — synchronize cannot express partial indexes.
 *  4. admins.user_id — the JWT↔admin authority link (AdminRolesGuard).
 *  5. products.requiresSellerApproval / approvalThreshold + the
 *     awaiting_seller_approval enum value (Decision 3b).
 *  6. GIN index mirroring the exact search expression in ProductService so
 *     to_tsvector @@ plainto_tsquery stops being a sequential scan.
 *
 * Idempotent: IF [NOT] EXISTS guards throughout, backfill predicates skip
 * already-correct rows. Safe to run over a DB where synchronize already did
 * the work.
 */
export class MoneyBackfillAndFts1790000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Schema: enum value for Decision 3b ────────────────────────────────
    // PG12+ allows ADD VALUE in a transaction as long as the value is not
    // used in the same transaction — nothing below writes it.
    await queryRunner.query(
      `ALTER TYPE "products_status_enum" ADD VALUE IF NOT EXISTS 'awaiting_seller_approval'`,
    );

    // ── Schema: invoices split columns ────────────────────────────────────
    await queryRunner.query(`ALTER TABLE "invoices"
      ADD COLUMN IF NOT EXISTS "other_charges" numeric(18,2) NOT NULL DEFAULT '0',
      ADD COLUMN IF NOT EXISTS "seller_net" numeric(18,2) NOT NULL DEFAULT '0',
      ADD COLUMN IF NOT EXISTS "platform_share" numeric(18,2) NOT NULL DEFAULT '0'`);

    // ── Schema: escrow hold split columns + partial unique index ─────────
    await queryRunner.query(`ALTER TABLE "escrow_holds"
      ADD COLUMN IF NOT EXISTS "sellerNet" numeric(18,2) NOT NULL DEFAULT '0',
      ADD COLUMN IF NOT EXISTS "platformShare" numeric(18,2) NOT NULL DEFAULT '0',
      ADD COLUMN IF NOT EXISTS "vatAmount" numeric(18,2) NOT NULL DEFAULT '0'`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_escrow_open_per_invoice"
      ON "escrow_holds" ("invoiceId") WHERE "status" IN ('held', 'disputed')`);

    // ── Schema: one live payment per invoice ─────────────────────────────
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_payment_live_per_invoice"
      ON "payments" ("invoiceId") WHERE "status" IN ('pending', 'succeeded')`);

    // ── Schema: admins.user_id (authority link) ──────────────────────────
    await queryRunner.query(`ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "userId" uuid`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_admin_user" ON "admins" ("userId")`);

    // ── Schema: Decision 3b seller-approval columns ──────────────────────
    await queryRunner.query(`ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "requiresSellerApproval" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "approvalThreshold" numeric(18,2)`);

    // ── Data backfill: invoices ───────────────────────────────────────────
    // seller_net = hammer − seller_fee; platform_share = buyer fee + seller
    // fee + other charges + fixed fee (fee-breakdown.ts, rounded once here).
    await queryRunner.query(`UPDATE "invoices"
      SET "seller_net" = ROUND("hammer_price" - COALESCE("seller_fee", 0), 2),
          "platform_share" = ROUND(
            COALESCE("commission", 0) + COALESCE("seller_fee", 0) +
            COALESCE("other_charges", 0) + COALESCE("fixed_fee", 0), 2)
      WHERE COALESCE("seller_net", 0) = 0
        AND COALESCE("hammer_price", 0) > 0`);

    // ── Data backfill: escrow holds inherit the invoice split ────────────
    await queryRunner.query(`UPDATE "escrow_holds" h
      SET "sellerNet" = i."seller_net",
          "platformShare" = i."platform_share",
          "vatAmount" = i."vat"
      FROM "invoices" i
      WHERE h."invoiceId" = i."id"
        AND COALESCE(h."sellerNet", 0) = 0
        AND COALESCE(i."seller_net", 0) > 0`);

    // ── Full-text search: expression index matching ProductService exactly ─
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_fts"
      ON "products" USING GIN (to_tsvector('english',
        COALESCE("title", '') || ' ' || COALESCE("description", '') || ' ' || COALESCE("category", '')))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_fts"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_payment_live_per_invoice"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_escrow_open_per_invoice"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_admin_user"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "userId"`);
    await queryRunner.query(`ALTER TABLE "products"
      DROP COLUMN IF EXISTS "approvalThreshold",
      DROP COLUMN IF EXISTS "requiresSellerApproval"`);
    await queryRunner.query(`ALTER TABLE "escrow_holds"
      DROP COLUMN IF EXISTS "vatAmount",
      DROP COLUMN IF EXISTS "platformShare",
      DROP COLUMN IF EXISTS "sellerNet"`);
    await queryRunner.query(`ALTER TABLE "invoices"
      DROP COLUMN IF EXISTS "platform_share",
      DROP COLUMN IF EXISTS "seller_net",
      DROP COLUMN IF EXISTS "other_charges"`);
    // Enum value removal is not supported by PostgreSQL; 'awaiting_seller_approval'
    // stays in the type after down().
  }
}

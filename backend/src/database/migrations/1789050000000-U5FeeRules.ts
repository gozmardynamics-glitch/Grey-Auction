import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * U5 fee rules (2026-09-02):
 *  - fee_configs: buyer/seller fee split + toggles + VAT base switch
 *  - fee_overrides: per-seller / per-product overrides (nullable = inherit)
 *  - products: seller-set minimum bid increment + escrow window fixed at creation
 *  - sellers: customizable payout frequency
 *  - invoices: seller-side fee + escrow audit columns
 *  - escrow_holds: auto-release timestamp
 *
 * Enum type names MUST match the entities' explicit `enumName` declarations
 * (fee_vat_base, fee_override_scope) or TypeORM synchronize will fight the
 * schema on every dev boot.
 */
export class U5FeeRules1789050000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "fee_vat_base" AS ENUM ('fees_only', 'hammer_and_fees')`);

    await queryRunner.query(`ALTER TABLE "fee_configs"
      ADD COLUMN "vatBase" "fee_vat_base" NOT NULL DEFAULT 'hammer_and_fees',
      ADD COLUMN "sellerCommissionPct" numeric(5,2) NOT NULL DEFAULT '5.00',
      ADD COLUMN "buyerFeeEnabled" boolean NOT NULL DEFAULT true,
      ADD COLUMN "sellerFeeEnabled" boolean NOT NULL DEFAULT true`);

    await queryRunner.query(`CREATE TYPE "fee_override_scope" AS ENUM ('seller', 'product', 'buyer')`);
    await queryRunner.query(`CREATE TABLE "fee_overrides" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "scope" "fee_override_scope" NOT NULL,
      "scopeId" uuid NOT NULL,
      "buyerFeePct" numeric(5,2),
      "buyerFeeEnabled" boolean,
      "sellerFeePct" numeric(5,2),
      "sellerFeeEnabled" boolean,
      "vatPct" numeric(5,2),
      "vatBase" "fee_vat_base",
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "PK_fee_overrides" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fee_overrides_scope" ON "fee_overrides" ("scope", "scopeId")`);

    await queryRunner.query(`ALTER TABLE "products"
      ADD COLUMN "minBidIncrement" numeric(18,2),
      ADD COLUMN "escrowReleaseHours" integer NOT NULL DEFAULT 72`);

    await queryRunner.query(`ALTER TABLE "sellers"
      ADD COLUMN "payout_frequency" varchar(20) NOT NULL DEFAULT 'weekly'`);

    await queryRunner.query(`ALTER TABLE "invoices"
      ADD COLUMN "seller_fee" numeric(18,2) NOT NULL DEFAULT '0',
      ADD COLUMN "fee_source" varchar(20) NOT NULL DEFAULT 'default',
      ADD COLUMN "vat_base" varchar(20) NOT NULL DEFAULT 'hammer_and_fees',
      ADD COLUMN "escrow_release_at" TIMESTAMP,
      ADD COLUMN "escrow_window_hours" integer`);

    await queryRunner.query(`ALTER TABLE "escrow_holds"
      ADD COLUMN "autoReleaseAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "escrow_holds" DROP COLUMN "autoReleaseAt"`);
    await queryRunner.query(`ALTER TABLE "invoices"
      DROP COLUMN "escrow_window_hours",
      DROP COLUMN "escrow_release_at",
      DROP COLUMN "vat_base",
      DROP COLUMN "fee_source",
      DROP COLUMN "seller_fee"`);
    await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "payout_frequency"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "escrowReleaseHours", DROP COLUMN "minBidIncrement"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fee_overrides_scope"`);
    await queryRunner.query(`DROP TABLE "fee_overrides"`);
    await queryRunner.query(`DROP TYPE "fee_override_scope"`);
    await queryRunner.query(`ALTER TABLE "fee_configs"
      DROP COLUMN "sellerFeeEnabled",
      DROP COLUMN "buyerFeeEnabled",
      DROP COLUMN "sellerCommissionPct",
      DROP COLUMN "vatBase"`);
    await queryRunner.query(`DROP TYPE "fee_vat_base"`);
  }
}
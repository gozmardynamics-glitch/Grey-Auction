import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrders1788173216909 implements MigrationInterface {
    name = 'AddOrders1788173216909'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'paid', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoiceId" uuid, "auctionId" uuid, "productId" uuid, "buyerId" uuid NOT NULL, "sellerId" uuid NOT NULL, "total" numeric(18,2) NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "paymentReference" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cfa3817af5e56ffc5adef90d4e" ON "orders" ("invoiceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1c382880db667beb75d26c5787" ON "orders" ("sellerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9877ffd9a491c3e82f5b32d4f4" ON "orders" ("buyerId") `);
        // NOTE: the 4 fractional decimal-default SET DEFAULT statements TypeORM
        // wanted to add here are a known cosmetic false-positive (see the
        // Baseline migration header) and are intentionally omitted.
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_9877ffd9a491c3e82f5b32d4f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1c382880db667beb75d26c5787"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfa3817af5e56ffc5adef90d4e"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    }

}

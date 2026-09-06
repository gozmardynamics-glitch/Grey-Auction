import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncEntities1789200000000 implements MigrationInterface {
    name = 'SyncEntities1789200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_fee_overrides_scope"`);
        await queryRunner.query(`ALTER TABLE "fee_configs" ALTER COLUMN "commissionPct" SET DEFAULT 5`);
        await queryRunner.query(`ALTER TABLE "fee_configs" ALTER COLUMN "vatPct" SET DEFAULT 7.5`);
        await queryRunner.query(`ALTER TABLE "fee_configs" ALTER COLUMN "sellerCommissionPct" SET DEFAULT 5`);
        await queryRunner.query(`ALTER TABLE "llm_models" ALTER COLUMN "defaultTemperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "ai_feature_configs" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "agent_instances" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0b1ccc9631addc45d3e0dc32a4" ON "fee_overrides" ("scope", "scopeId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_0b1ccc9631addc45d3e0dc32a4"`);
        await queryRunner.query(`ALTER TABLE "agent_instances" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "ai_feature_configs" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "llm_models" ALTER COLUMN "defaultTemperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "fee_configs" ALTER COLUMN "sellerCommissionPct" SET DEFAULT 5.00`);
        await queryRunner.query(`ALTER TABLE "fee_configs" ALTER COLUMN "vatPct" SET DEFAULT 7.5`);
        await queryRunner.query(`ALTER TABLE "fee_configs" ALTER COLUMN "commissionPct" SET DEFAULT '10'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fee_overrides_scope" ON "fee_overrides" ("scope", "scopeId") `);
    }

}

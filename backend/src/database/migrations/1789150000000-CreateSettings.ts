import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSettings1789150000000 implements MigrationInterface {
    name = 'CreateSettings1789150000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "settings" ("key" character varying(100) NOT NULL, "value" jsonb, "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_settings_key" PRIMARY KEY ("key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "settings"`);
    }

}

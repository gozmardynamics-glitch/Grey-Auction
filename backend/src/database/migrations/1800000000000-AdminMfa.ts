import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Second-factor authentication for administrators.
 *
 * Admins move money: they refund escrow, release holds, credit wallets and
 * suspend accounts. Until now that authority sat behind a single password, so a
 * leaked credential was a direct route to the platform's money. These columns
 * hold each admin's TOTP enrolment state (secret encrypted at rest), the
 * brute-force counters, and the timestamp that drives step-up re-authentication
 * for the most consequential actions.
 */
export class AdminMfa1800000000000 implements MigrationInterface {
  name = 'AdminMfa1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "mfaEnabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "mfaSecret" text`);
    await queryRunner.query(
      `ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "mfaRecoveryCodes" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "mfaEnrolledAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "mfaFailedAttempts" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "mfaLockedUntil" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "mfaLastStep" bigint`);
    await queryRunner.query(`ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "lastMfaAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "lastMfaAt"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "mfaLastStep"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "mfaLockedUntil"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "mfaFailedAttempts"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "mfaEnrolledAt"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "mfaRecoveryCodes"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "mfaSecret"`);
    await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN IF EXISTS "mfaEnabled"`);
  }
}

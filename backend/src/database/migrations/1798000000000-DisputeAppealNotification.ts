import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `dispute_appealed` as a notification type.
 *
 * The appeal notification was written with a cast rather than a real enum value,
 * so the insert failed against the database enum and the failure was swallowed by
 * a catch: the appeal committed and nobody was told. The type belongs in the enum.
 */
export class DisputeAppealNotification1798000000000 implements MigrationInterface {
  name = 'DisputeAppealNotification1798000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'dispute_appealed'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres cannot remove a single enum value without rewriting the type and
    // every row that uses it; leaving it is harmless.
  }
}

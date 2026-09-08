import { Module } from '@nestjs/common';
import { DatabaseBackupService } from './database-backup.service';
import { BackupController } from './backup.controller';

/**
 * G51 — automated database backups (pg_dump → gzip → S3-compatible store).
 * The service self-gates on DB_BACKUP_ENABLED + S3 credentials; registering
 * it is inert in dev/CI.
 */
@Module({
  controllers: [BackupController],
  providers: [DatabaseBackupService],
  exports: [DatabaseBackupService],
})
export class BackupModule {}

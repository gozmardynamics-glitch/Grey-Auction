import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DatabaseBackupService } from './database-backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../admin/entities/admin.entity';

/**
 * G51 — manual backup triggers (SUPER_ADMIN only).
 *
 * Needed by the D1 cutover procedure (backup → stamp → deploy → verify per
 * docs/DB_MIGRATIONS_RUNBOOK.md) and for pre-incident snapshots.
 */
@ApiTags('Backups')
@Controller('admin/backups')
@UseGuards(JwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN)
@ApiBearerAuth()
export class BackupController {
  constructor(private readonly backupService: DatabaseBackupService) {}

  @Post('run')
  @ApiOperation({ summary: 'Run a database backup now (manual trigger)' })
  async run() {
    const result = await this.backupService.runBackup('manual');
    return {
      success: result !== null,
      message:
        result !== null
          ? 'Backup uploaded'
          : 'Backup skipped or failed — check server log / DB_BACKUP_* env',
      data: result,
    };
  }

  @Get('config')
  @ApiOperation({ summary: 'Backup configuration state (no secrets)' })
  async config() {
    return { success: true, data: this.backupService.status() };
  }
}

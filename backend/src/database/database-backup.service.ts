import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { spawn } from 'child_process';
import {
  createReadStream,
  createWriteStream,
  readdirSync,
  statSync,
  unlinkSync,
  existsSync,
  mkdirSync,
} from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { join } from 'path';

/**
 * G51 — automated database backups to any S3-compatible object store
 * (AWS S3, Cloudflare R2, MinIO — the same S3_* env vars the storage
 * driver already uses, plus DB_BACKUP_* tuning).
 *
 * Design notes:
 * - Env-gated: no-op unless DB_BACKUP_ENABLED=true AND S3 creds exist, so
 *   local dev (and CI without credentials) never triggers a backup.
 * - Uses pg_dump (must be on PATH — the Dockerfile installs
 *   postgresql-client). Passwordless from inside the container network:
 *   PGPASSWORD is set per-invocation from the same DB_PASSWORD env the app
 *   already uses. Never logged.
 * - Streams pg_dump → gzip → S3 upload via a temp file so memory use stays
 *   bounded regardless of DB size.
 * - Retention: DB_BACKUP_KEEP_DAYS (default 14) — deletes older local dumps
 *   after upload. Object-store lifecycle rules remain the source of truth
 *   for remote retention (documented in docs/DB_BACKUPS_RUNBOOK.md).
 * - Failure policy: log + optional webhook (DB_BACKUP_ALERT_WEBHOOK_URL).
 *   Backups never throw into request paths — they only run on cron.
 */
@Injectable()
export class DatabaseBackupService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseBackupService.name);

  private readonly enabled: boolean;
  private readonly bucket: string;
  private readonly prefix: string;
  private readonly keepDays: number;
  private readonly alertWebhook: string;
  private readonly tmpDir: string;
  private readonly s3: S3Client | null;

  constructor() {
    const accessKey = process.env.S3_ACCESS_KEY || '';
    const secretKey = process.env.S3_SECRET_KEY || '';
    this.enabled =
      process.env.DB_BACKUP_ENABLED === 'true' &&
      !!accessKey &&
      !!secretKey &&
      !!process.env.S3_BUCKET;
    this.bucket = process.env.S3_BUCKET || 'greyauction';
    this.prefix = (process.env.DB_BACKUP_S3_PREFIX || 'db-backups').replace(/\/+$/, '');
    this.keepDays = parseInt(process.env.DB_BACKUP_KEEP_DAYS || '14', 10);
    this.alertWebhook = process.env.DB_BACKUP_ALERT_WEBHOOK_URL || '';
    this.tmpDir = process.env.DB_BACKUP_TMP_DIR || '/tmp/greyauction-backups';

    this.s3 = this.enabled
      ? new S3Client({
          region: process.env.S3_REGION || 'us-east-1',
          endpoint: process.env.S3_ENDPOINT || undefined,
          forcePathStyle: !!process.env.S3_ENDPOINT, // MinIO/R2 path-style
          credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
        })
      : null;
  }

  /** Boot-time visibility: a misconfigured prod backup must not stay silent. */
  onModuleInit() {
    if (this.enabled) {
      this.logger.log(
        'Automated DB backups ENABLED → s3://' + this.bucket + '/' + this.prefix + ' (retention ' + this.keepDays + 'd local)',
      );
    } else if (process.env.DB_BACKUP_ENABLED === 'true') {
      this.logger.warn(
        'DB_BACKUP_ENABLED=true but S3_ACCESS_KEY/S3_SECRET_KEY/S3_BUCKET are missing — backups are DISABLED',
      );
    }
  }

  /** Non-secret config snapshot for the admin status endpoint. */
  status() {
    return {
      enabled: this.enabled,
      bucket: this.bucket,
      prefix: this.prefix,
      keepDays: this.keepDays,
      schedule: 'EVERY_DAY_AT_2AM (UTC)',
      alertWebhookConfigured: !!this.alertWebhook,
    };
  }

  // 02:00 UTC daily (off-peak; exchange-rate cron runs 03:00).
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runScheduledBackup() {
    if (!this.enabled) return;
    await this.runBackup('cron');
  }

  /** Execute one backup: dump → gzip → upload → local retention. */
  async runBackup(trigger: 'cron' | 'manual'): Promise<{ key: string; bytes: number } | null> {
    if (!this.enabled || !this.s3) {
      this.logger.warn('Backup requested (' + trigger + ') but backups are not enabled/configured');
      return null;
    }

    mkdirSync(this.tmpDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpFile = this.tmpDir + '/greyauction-' + stamp + '.sql';
    const gzFile = dumpFile + '.gz';
    const s3Key = this.prefix + '/' + stamp + '.sql.gz';

    try {
      await this.dump(dumpFile);
      await this.gzip(dumpFile, gzFile);
      const bytes = statSync(gzFile).size;
      await this.upload(gzFile, s3Key);
      this.logger.log('Backup ' + trigger + ' OK → s3://' + this.bucket + '/' + s3Key + ' (' + bytes + ' bytes)');
      this.pruneLocalDumps();
      return { key: s3Key, bytes };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('Backup ' + trigger + ' FAILED: ' + message);
      await this.alert('DB backup failed (' + trigger + '): ' + message).catch(() => undefined);
      return null;
    } finally {
      for (const f of [dumpFile, gzFile]) {
        if (existsSync(f)) {
          try {
            unlinkSync(f);
          } catch {
            /* best-effort cleanup */
          }
        }
      }
    }
  }

  /** pg_dump with a plain-SQL custom dump; PGPASSWORD injected per-spawn. */
  private dump(outFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '--no-owner',
        '--no-privileges',
        '-h', process.env.DB_HOST || 'localhost',
        '-p', process.env.DB_PORT || '5432',
        '-U', process.env.DB_USERNAME || 'postgres',
        '-d', process.env.DB_DATABASE || 'greyauction',
        '-f', outFile,
      ];
      const child = spawn('pg_dump', args, {
        env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || 'postgres' },
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      let stderr = '';
      child.stderr.on('data', (d: Buffer) => {
        stderr += d.toString();
      });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('pg_dump exited ' + code + ': ' + stderr.slice(-400)));
      });
    });
  }

  private async gzip(src: string, dest: string): Promise<void> {
    await pipeline(
      createReadStream(src),
      createGzip({ level: 9 }),
      createWriteStream(dest),
    );
  }

  private async upload(file: string, key: string): Promise<void> {
    await this.s3!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: createReadStream(file),
        ContentType: 'application/gzip',
        ServerSideEncryption: 'AES256',
      }),
    );
  }

  /** Best-effort local retention: keep the newest keepDays *.sql.gz dumps. */
  private pruneLocalDumps() {
    try {
      const files = readdirSync(this.tmpDir)
        .filter((f) => f.endsWith('.sql.gz'))
        .map((f) => join(this.tmpDir, f))
        .sort()
        .reverse();
      for (const f of files.slice(this.keepDays)) {
        try {
          unlinkSync(f);
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* tmp dir may not exist yet */
    }
  }

  /** Optional failure alerting (Slack/Discord-style JSON webhook). */
  private async alert(text: string): Promise<void> {
    if (!this.alertWebhook) return;
    await fetch(this.alertWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '[GreyAuction] ' + text }),
      signal: AbortSignal.timeout(5000),
    });
  }
}

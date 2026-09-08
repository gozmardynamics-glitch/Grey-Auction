import { DatabaseBackupService } from './database-backup.service';

/**
 * G51 — the env-gating is the safety-critical behaviour: CI/dev runs have no
 * S3 credentials and must NEVER attempt a pg_dump spawn or S3 call.
 */
describe('DatabaseBackupService env gating (G51)', () => {
  const envSnapshot: Record<string, string | undefined> = {};
  const KEYS = [
    'DB_BACKUP_ENABLED',
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY',
    'S3_BUCKET',
  ];

  beforeAll(() => {
    for (const k of KEYS) envSnapshot[k] = process.env[k];
  });

  afterAll(() => {
    for (const k of KEYS) {
      if (envSnapshot[k] === undefined) delete process.env[k];
      else process.env[k] = envSnapshot[k];
    }
  });

  it('is disabled with no env at all', () => {
    delete process.env.DB_BACKUP_ENABLED;
    delete process.env.S3_ACCESS_KEY;
    delete process.env.S3_SECRET_KEY;
    delete process.env.S3_BUCKET;
    const svc = new DatabaseBackupService();
    expect(svc.status().enabled).toBe(false);
  });

  it('stays disabled when DB_BACKUP_ENABLED=true but S3 creds are missing', () => {
    process.env.DB_BACKUP_ENABLED = 'true';
    delete process.env.S3_ACCESS_KEY;
    delete process.env.S3_SECRET_KEY;
    delete process.env.S3_BUCKET;
    const svc = new DatabaseBackupService();
    expect(svc.status().enabled).toBe(false);
  });

  it('runBackup returns null (no spawn) while disabled', async () => {
    delete process.env.DB_BACKUP_ENABLED;
    const svc = new DatabaseBackupService();
    await expect(svc.runBackup('manual')).resolves.toBeNull();
  });

  it('arms only with explicit opt-in AND full S3 credentials', () => {
    process.env.DB_BACKUP_ENABLED = 'true';
    process.env.S3_ACCESS_KEY = 'ak';
    process.env.S3_SECRET_KEY = 'sk';
    process.env.S3_BUCKET = 'backups-bucket';
    const svc = new DatabaseBackupService();
    const st = svc.status();
    expect(st.enabled).toBe(true);
    expect(st.bucket).toBe('backups-bucket');
    expect(st.prefix).toBe('db-backups');
  });
});

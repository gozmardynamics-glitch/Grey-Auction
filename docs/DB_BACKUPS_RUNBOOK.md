# DB Backups Runbook (G51)

App-level automated PostgreSQL backups: **pg_dump → gzip → S3-compatible
object store**, on a daily cron, with local-tmp retention and failure
alerting. The service self-gates: **zero behaviour unless explicitly armed**.

## Arming backups (production)

Set these in Coolify → backend service → Environment Variables, then
redeploy (a restart is enough — the service reads env at boot):

| Var | Required | Value |
|-----|----------|-------|
| `DB_BACKUP_ENABLED` | ✅ | `true` (anything else = disabled) |
| `S3_BUCKET` | ✅ | bucket for dumps (shared with uploads bucket is fine; objects go under a `db-backups/` prefix) |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | ✅ | credentials with **PutObject** on the bucket (read/delete if lifecycle pruning is done app-side) |
| `S3_REGION` | | default `us-east-1` |
| `S3_ENDPOINT` | | only for MinIO/R2/custom endpoint (path-style is then forced on) |
| `DB_BACKUP_KEEP_DAYS` | | local temp retention, default `14` |
| `DB_BACKUP_S3_PREFIX` | | object prefix, default `db-backups` |
| `DB_BACKUP_ALERT_WEBHOOK_URL` | | Slack/Discord-shaped `{text}` webhook for backup failures |
| `DB_BACKUP_TMP_DIR` | | default `/tmp/greyauction-backups` |

Boot log when armed:
`Automated DB backups ENABLED → s3://<bucket>/<prefix> (retention Nd local)`
Boot **warning** when half-configured (enabled but missing creds) — take it
seriously: a silent misconfig is how unbacked prod databases happen.

Remote (S3) retention is best set as a **bucket lifecycle rule** (e.g.
expire `db-backups/*` after 35 days) — that is the durable graveyard; the
app only prunes its own temp files.

## Verification after arming

1. Boot logs show ENABLED (not the warning).
2. Manual trigger as SUPER_ADMIN:
   `POST /api/admin/backups/run` → `{ success: true, data: { key, bytes } }`.
3. Config snapshot (no secrets):
   `GET /api/admin/backups/config`.
4. Next 02:00 UTC: new object
   `db-backups/<ISO-stamp>.sql.gz` in the bucket.

## Restore procedure

```bash
# 1. Fetch the dump (s3cmd / aws cli / bucket console)
aws s3 cp s3://<bucket>/db-backups/<stamp>.sql.gz /tmp/dump.sql.gz
gunzip /tmp/dump.sql.gz

# 2. Restore into a FRESH empty database (never over a live one)
psql -h <host> -U postgres -c 'CREATE DATABASE greyauction_restore'
psql -h <host> -U postgres -d greyauction_restore -f /tmp/dump.sql

# 3. Spot-check the money tables before swapping
psql -d greyauction_restore -c 'SELECT count(*), sum(amount) FROM payments'
psql -d greyauction_restore -c 'SELECT status, count(*) FROM invoices GROUP BY status'
```

The dump is plain SQL (no ownership/GRANTs), so it restores onto any role.

## Notes

- **pg_dump version**: the backend image installs
  `postgresql16-client`. The Postgres server must be ≤ 16 — currently PG16
  per the deploy stack. If the server upgrades, bump the package in
  `backend/Dockerfile`.
- **Schedule**: `EVERY_DAY_AT_2AM` UTC (exchange rates run 03:00, escrow
  sweeps every 5 min — no overlap).
- **Security**: dumps contain full user/PII/wallet data. The bucket must be
  private (it is by default); server-side AES256 is requested per-object.
- **Dev/CI**: never runs (gated off); unit specs cover only the gating.
- Manual DB dumps for the D1 cutover remain the DBA path:
  `docs/DB_MIGRATIONS_RUNBOOK.md` (backup step) — this service complements it.

# Database Migrations Runbook — D1 cutover (remove `synchronize: true` from prod)

> Validated 2026-09-05 against Postgres 16 (docker `greyauction-postgres`).
> Chain: 5 migrations, empty-DB run exit 0, **zero schema drift** vs entities afterwards.

## Migration chain (applied in timestamp order)

| Timestamp | Name | What it does |
|---|---|---|
| 1788166706152 | Baseline | Full initial schema (all entities at that point) |
| 1788173216909 | AddOrders | Orders tables |
| 1789050000000 | U5FeeRules | U5 fee-config tables/columns |
| 1789150000000 | CreateSettings | Settings persistence |
| 1789200000000 | SyncEntities | Drift sync: fee/temperature numeric defaults normalized (unquoted), `fee_overrides` unique index renamed to the entity-generated name |

**Behavior after this deploy** (see `backend/src/config/database.config.ts`):
- dev/test: `synchronize` stays ON unless `DB_SYNCHRONIZE=false`.
- production: `synchronize` is OFF unless the one-time `DB_SYNCHRONIZE=true` bootstrap flag is set;
  `migrationsRun: true` — **every backend boot applies pending migrations automatically**.

## Path A — fresh/empty database (CI, staging, new env)

Nothing manual. Boot the backend (or run `npm run migration:run`) — all 5 migrations apply in order.

Validated locally:
```bash
cd backend
DB_DATABASE=<empty_db> DB_SYNCHRONIZE=false npm run migration:run   # exit 0, 5/5 applied
# drift check — generates a file only if entities and schema diverge:
DB_DATABASE=<empty_db> DB_SYNCHRONIZE=false npm run migration:generate -- src/database/migrations/_Probe
# → no file created = converged. (Delete any _Probe file before committing.)
```

## Path B — the EXISTING production database (bootstrap-created, no migrations table)

The prod schema was created by the one-time `DB_SYNCHRONIZE=true` bootstrap, so it has **no
`migrations` table** and all tables already exist. Running the chain blind would fail with
`relation already exists`. Stamp the four historical migrations as applied, then let
`SyncEntities` run for real:

```sql
-- 0) BACKUP FIRST (see below). Then:
CREATE TABLE IF NOT EXISTS "migrations" (
  "id" SERIAL PRIMARY KEY,
  "timestamp" bigint NOT NULL,
  "name" character varying NOT NULL
);
INSERT INTO "migrations" ("timestamp", "name") VALUES
  (1788166706152, 'Baseline1788166706152'),
  (1788173216909, 'AddOrders1788173216909'),
  (1789050000000, 'U5FeeRules1789050000000'),
  (1789150000000, 'CreateSettings1789150000000');
```

Then deploy the backend (NODE_ENV=production, **no** `DB_SYNCHRONIZE` in env). On boot it
applies only `SyncEntities1789200000000`:
- normalizes `fee_configs`/`llm_models`/`ai_feature_configs`/`agent_instances` numeric defaults,
- renames `fee_overrides`' unique index to the entity-generated name — safe because
  bootstrap-created DBs carry the same `IDX_fee_overrides_scope` name (verified via generate
  against a synchronize-built schema).

## Pre-cutover checklist (executed on prod by the operator)

1. **Backup** (from the Coolify host or any machine with psql access):
   ```bash
   pg_dump -h <host> -p <port> -U postgres -Fc -d greyauction -f greyauction-pre-d1.dump
   ```
2. Confirm env: `NODE_ENV=production`, `DB_SYNCHRONIZE` **absent** (or not `true`).
3. Apply the Path B SQL stamp.
4. Deploy the backend release containing the migration chain.
5. Verify:
   ```sql
   SELECT "name" FROM "migrations" ORDER BY "id";          -- 5 rows, SyncEntities last
   SELECT count(*) FROM information_schema.tables WHERE table_schema='public';
   ```
   Backend boots clean; `GET /api/health` returns 200.
6. **Rollback** (only if boot fails): stop backend, restore, redeploy previous image:
   ```bash
   pg_restore -h <host> -p <port> -U postgres -d greyauction --clean --if-exists greyauction-pre-d1.dump
   ```

## Conventions going forward

- **Never** set `DB_SYNCHRONIZE=true` in production again (bootstrap flag is retired after cutover).
- Schema changes = edit entity → `npm run migration:generate -- src/database/migrations/<Name>`
  → review the generated SQL → commit. If the file starts with `_` or contains only
  quoted-default phantom ALTERs, delete it (see gotcha below).
- **TypeORM phantom-drift gotcha**: Postgres stores numeric defaults canonically, so
  `SET DEFAULT '7.5'` (quoted) vs `7.5` compare unequal to TypeORM and regenerate forever.
  Fix the migration to unquoted literals and the phantom disappears (this is exactly what
  `SyncEntities` normalizes).
- Migration filenames must sort by timestamp: a hand-authored migration with a **future**
  timestamp (e.g. `1789050000000`) sorts AFTER generated ones — keep new work above
  `1789200000000` or re-stamp.

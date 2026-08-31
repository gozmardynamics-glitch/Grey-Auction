# GreyAuction — Operations & Deployment Guide

How storage, testing, and deployment fit together. Commands verified against
the current codebase (P5, 2026-08-31).

## 1. Object storage (images & documents)

Architecture: StorageService (facade) -> StorageDriver (interface) ->
LocalStorageDriver (disk) or S3StorageDriver (any S3-compatible store).
Images are auto-optimized by ImageOptimizerService (sharp): auto-orient,
bound to 2560px, re-encoded to WebP, plus three responsive variants
(thumb 200px, medium 600px, large 1200px). Documents (PDF/DOCX) are
stored verbatim. deleteFile() removes the original and all variants.

### Driver selection (env)

| Env var | Default | Meaning |
|---|---|---|
| STORAGE_DRIVER | local | local = disk under ./uploads; s3 = S3-compatible |
| S3_ENDPOINT | - | e.g. http://minio:9000 (MinIO) or https://<acct>.r2.cloudflarestorage.com (R2) |
| S3_ACCESS_KEY / S3_SECRET_KEY | - | credentials |
| S3_BUCKET | greyauction | bucket name |
| S3_REGION | us-east-1 | region |
| S3_PUBLIC_HOST | - | optional public/CDN host (R2 custom domain) |
| S3_FORCE_PATH_STYLE | true | MinIO/R2 need path-style; set false for AWS S3 |

If STORAGE_DRIVER=s3 but endpoint/credentials are missing, the app logs a
warning and falls back to local disk (fail-safe).

### Silent switch to Cloudflare R2 (later)

No code change. Point the same vars at R2:

```
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<R2 access key id>
S3_SECRET_KEY=<R2 secret access key>
S3_BUCKET=greyauction
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_HOST=cdn.yourdomain.com   # optional
```

Local URLs are served by the backend at /uploads/*; S3 URLs are served
directly by the object store.

### Storage smoke test

```bash
# 1. start a throwaway MinIO
docker run -d --name minio-smoke -p 9010:9000 -e MINIO_ROOT_USER=greyauction -e MINIO_ROOT_PASSWORD=greyauction-test-secret minio/minio server /data
# 2. create bucket + public-read policy (single mc run keeps the alias)
docker run --rm --network host --entrypoint sh minio/mc -c "mc alias set smoke http://localhost:9010 greyauction greyauction-test-secret && mc mb --ignore-existing smoke/greyauction-test && mc anonymous set download smoke/greyauction-test"
# 3. run the 24-check round trip (upload/optimize/variants/fetch/delete + local driver)
cd backend
S3_ENDPOINT=http://localhost:9010 S3_ACCESS_KEY=greyauction S3_SECRET_KEY=greyauction-test-secret S3_BUCKET=greyauction-test npx ts-node scripts/storage-smoke.ts
```

## 2. Testing matrix

| Layer | Command | Needs |
|---|---|---|
| Unit + service tests | cd backend && npm test | nothing (mocked DB) |
| HTTP-layer E2E | cd backend && npm run test:e2e | nothing |
| Money-path integration | cd backend && npm run itest:db then npm run itest | running Postgres, DB_DATABASE=greyauction_itest, DB_SYNCHRONIZE=false |
| Frontend unit (Vitest) | cd frontend && npm test | nothing |
| API contract generation | cd frontend && npm run generate:api | backend running on :3001 (non-prod) |
| Load / Lighthouse | cd frontend && npm run test:load:bidding etc. | see loadtest/README.md |

Integration DB provisioning is idempotent: backend/scripts/itest-db-setup.ts
drops and recreates greyauction_itest and applies all TypeORM migrations,
so the suite always runs against a migrations-only schema.

The integration suite covers: register -> list -> bid -> end auction ->
settlement invoice -> payment init -> HMAC-signed webhook -> order paid ->
webhook replay idempotency -> wallet deposit idempotency.

## 3. Deployment (Coolify / docker compose)

The stack lives in docker-compose.coolify.yml (postgres, minio,
minio-init bucket provisioning, backend, frontend).

```bash
cp backend/.env.example backend/.env      # fill JWT_SECRET + any provider keys
docker compose -f docker-compose.coolify.yml up -d --build
```

On first deploy the DB schema comes from migrations, not synchronize
(production sets migrationsRun: true automatically). To bootstrap manually:

```bash
cd backend && npm run migration:run
```

Required env for production (see backend/.env.example): JWT_SECRET
(mandatory — the app refuses to boot without it in production), DB_* ,
FRONTEND_URL, CORS_ORIGIN, NEXTAUTH_URL (frontend),
NEXT_PUBLIC_API_URL (frontend). Swagger docs are disabled in production;
the OpenAPI JSON (/api/docs-json) is development-only.

## 4. Health & observability

- GET /api/health — DB-free liveness probe (uptime + timestamp).
- Every response carries an x-request-id header (propagated inbound).
- Errors are shaped into { success: false, statusCode, requestId, message,
  path } and never leak stack traces.

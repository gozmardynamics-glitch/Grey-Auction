# Grey Auction — Deployment Checklist

**Living document. First written 2026-10-27. Owner: platform engineering.**

Everything here is derived from the code in this repository, not from a generic
template — env names, ports, paths and file references were read out of the
source. Where a statement depends on a Cloudflare plan entitlement or a
third-party limit, it says "verify at build time" because those change.

**How to use it.** Work top to bottom for a first deploy. Every item carries a
status marker:

| Marker | Meaning |
|---|---|
| `[x]` | Done in code / already true today |
| `[ ]` | **Must** be done before the first production deploy (Scope 0) |
| `[~]` | Needed before opening to the public (Scope 1) |
| `[>]` | Later optimisation (Scope 2+) |

Scope definitions are in §14. §13 is the short "what do I do on Monday" list.

---

## 1. What we are actually deploying

Two Node.js processes and their data stores. Nothing in this stack can move to
Cloudflare Workers as-is, and pretending otherwise is how a migration stalls:

| Component | Runtime | Why it cannot be a Worker (today) |
|---|---|---|
| `frontend` (Next.js 16 App Router + next-intl + Auth.js) | Node 22, `next start` | Uses Node APIs in the BFF route, `sharp`-style image work via `next/image`, server components that call the API over TCP |
| `backend` (NestJS 11) | Node 22, `node dist/src/main.js` | Long-lived process hosting **Socket.IO** gateways, `@nestjs/schedule` crons, BullMQ workers, `pg_dump` backups, `sharp` |
| PostgreSQL 16 | managed or container | relational, transactional, `pg_advisory_xact_lock` |
| Redis 7 (optional but recommended) | managed or container | BullMQ queues |
| Object storage | **Cloudflare R2** | S3-compatible, already supported by the storage driver |

**Therefore the Cloudflare role is: edge in front, storage behind.** DNS, TLS,
caching, WAF, tunnels, rate limiting and R2 — with the app servers staying on
Node. That gets ~all the operational benefit with no rewrite.

```
                    ┌─────────────────────────── Cloudflare edge ───────────────────────────┐
  visitor ──HTTPS──▶│ DNS proxy · TLS · WAF · Bot Fight · Cache Rules · Rate Limiting ·      │
                    │ Turnstile (later) · Access (admin/staging, later)                      │
                    └───────────────┬──────────────────────────────┬────────────────────────┘
                                    │ /                            │ api.greyauction.com
                                    ▼                              ▼  (websocket + webhook)
                        ┌───────────────────────┐          ┌────────────────────────┐
                        │ frontend :3000        │ ──BFF──▶ │ backend :3001          │
                        │ next start (Node)     │  /api/   │ NestJS + Socket.IO     │
                        └───────────┬───────────┘  proxy   └────┬─────────┬─────────┘
                                    │                           │         │
                        ┌───────────▼──────────┐      ┌─────────▼──┐  ┌───▼──────────┐
                        │ R2: grey-auction-    │      │ Postgres 16│  │ Redis 7      │
                        │ public (images)      │      │            │  │ BullMQ       │
                        │ R2: grey-auction-    │      └────────────┘  └──────────────┘
                        │ private (kyc, docs)  │
                        └──────────────────────┘
                              cdn.greyauction.com
```

Two hostnames, deliberately: `greyauction.com` (and `www`) → frontend;
`api.greyauction.com` → backend. The browser talks to the backend directly only
for **websockets** and for **payment webhook callbacks**, both of which need to
reach port 3001 without the Next.js hop.

---

## 2. Cloudflare bill of materials

| Product | Use here | Plan | Scope |
|---|---|---|---|
| **DNS** | proxy `greyauction.com`, `www`, `api`, `cdn` | Free | 0 |
| **SSL/TLS** | *Full (strict)* against the origin cert; Always Use HTTPS; HSTS once stable | Free | 0 |
| **R2** | images (public bucket) + KYC/documents (private bucket) + `pg_dump` archives | Free tier: 10 GB storage, 1 M Class-A, 10 M Class-B ops, **zero egress** — verify | 0 |
| **Cache Rules** | cache `/` and lot pages at the edge; **bypass** `/api/*`, `/admin/*`, `/seller/*`, `/buyer/*`, `/checkout/*`, `/auth/*` | Free (rules limited) | 0 |
| **Cloudflare Tunnel** (`cloudflared`) | publish the origin without opening 80/443 — removes the "attack the VPS IP" path | Free | 0 (alternative: plain proxied A record) |
| **WAF + Rate limiting rules** | edge rate limits on `/api/auth/login`, `/api/auth/register`, `/api/payments/init`; managed ruleset where the plan allows | Free tier is limited, more rules on Pro | 1 |
| **Bot Fight Mode** | on, **with a WAF skip rule for `/api/payments/webhook/*`** | Free | 1 |
| **Turnstile** | registration, contact form, password reset | Free | 2 |
| **Access (Zero Trust)** | put an identity gate in front of `/admin/*` and the whole staging hostname | Free ≤50 users — verify | 2 |
| **Images** | optional replacement for the in-app `sharp` variants | **Paid** per image | 3 |
| **Workers** | cheap edge wins: redirects, security headers, A/B — *not* the app | Free 100k req/day | 2 |
| **Logpush** | ship edge logs to R2 | **Plan-dependent (Enterprise on some products)** — verify | 3 |
| **Argo / Tiered Cache** | origin offload at scale | Paid | 3 |

**Not applicable, do not plan around them:** D1 (this app is Postgres, not
SQLite), Hyperdrive (accelerates Postgres *from Workers* — the app is a Node
server with its own pool), Cloudflare Queues (BullMQ/Redis already does this),
Cloudflare Stream (no video), Pages (cannot host `next start` with socket.io).

---

## 3. Domain, DNS and TLS

`[ ]` **3.1** Register/confirm `greyauction.com` in the Cloudflare account that
already owns the R2 bucket (`grey-auction`, endpoint
`https://ff486626c9f1a7bdfce5ed9188ebae4e.r2.cloudflarestorage.com` — see
`docs/KEYS_AND_ACCESS.md` §1).

`[ ]` **3.2** DNS records (all proxied 🟠 unless noted):

| Name | Type | Target | Proxy | Note |
|---|---|---|---|---|
| `greyauction.com` | A/AAAA or CNAME | origin (or `…cfargotunnel.com`) | 🟠 | frontend |
| `www` | CNAME | `greyauction.com` | 🟠 | plus a Redirect Rule to apex |
| `api` | A/AAAA or CNAME | origin (or tunnel) | 🟠 | backend; websockets + webhooks |
| `cdn` | CNAME | `<bucket>.r2…` custom domain | — | **DNS only** (grey cloud); R2 terminates TLS itself |
| `staging` | A/AAAA | staging origin | 🟠 | optional; put Access in front |

`[ ]` **3.3** SSL/TLS mode **Full (strict)**. The origin must present a real
certificate: either a Cloudflare **Origin Certificate** installed on Traefik, or
Let's Encrypt via DNS-01. *Flexible* would loop endlessly because the origin
redirects HTTP→HTTPS.

`[ ]` **3.4** Always Use HTTPS on; Automatic HTTPS Rewrites on. The API already
sends `Strict-Transport-Security` through `helmet()`; the frontend does not, so
Cloudflare's HSTS toggle is what covers it. Turn it on once apex, `www` and
`api` are all on Full (strict) — and think before keeping
`includeSubDomains`, because HSTS is very hard to undo.

`[ ]` **3.5** Websockets are proxied on all plans, but: **do not cache**
`/socket.io/*` and keep the origin's idle timeout under Cloudflare's ~100 s
websocket idle cut-off. Socket.IO's default 25 s ping is safely inside it.

`[ ]` **3.6** Body size: Cloudflare Free/Pro cap request bodies at 100 MB, the
app caps uploads at 10 MB (`StorageService.MAX_FILE_SIZE`) and JSON at 5 MB
(`main.ts`). No conflict; no rule needed.

`[ ]` **3.7** Set `NEXT_PUBLIC_SITE_URL=https://greyauction.com` — it feeds
`robots.ts`, `sitemap.ts` and canonical/OG tags.

---

## 4. Compute: hosts, sizing and capacity

### 4.1 Recommended topology for launch

| Role | Size | Notes |
|---|---|---|
| frontend | 2 vCPU / 2 GB | Next.js SSR + the BFF proxy; memory-hungry at build time, not at runtime |
| backend | **2 vCPU / 4 GB** | `sharp` (image optimisation) and `pg_dump` are the peaks; 2 GB works but leaves no headroom |
| Postgres | 2 vCPU / 4 GB / 100 GB SSD, or managed | see §7 |
| Redis | 1 vCPU / 1 GB, `maxmemory-policy noeviction` | BullMQ **must not** have keys evicted |
| staging | same images, half the size, separate DB and bucket | see §12 |

`[ ]` **4.1.1** One backend replica for launch. This is a **hard constraint, not
a preference** — see §9 for why socket.io and the rate limiter break with two.

`[ ]` **4.1.2** Put `cloudflared` (tunnel) or Traefik with the origin cert on the
host; only the tunnel/80/443 touches the internet. Postgres, Redis and R2
credentials never leave the private network.

### 4.2 Capacity math (do this once, then re-measure)

Per backend instance:

* **DB pool** = `DB_POOL_SIZE` (default 20) + the backup/queue side channels.
  Postgres `max_connections` default 100. With **1** backend instance: 20 is
  right. **3 instances → 60**, still safe; **5 → 100**, at the limit — then you
  need `pgbouncer` in transaction mode. **Rule: total pool < 80 % of
  `max_connections`.**
* **Socket connections**: each socket holds a file descriptor and ~30–60 KB.
  4 GB instance handles ~5–10 k sockets comfortably. A live auction room is the
  peak: bidding fan-out is per-room, so the real question is *rooms × bidders*.
* **Uploads**: 10 MB cap, buffered in memory (`multer` memory storage) and
  re-encoded four times per image (original + 3 variants). Ten simultaneous
  10 MB uploads is ~400 MB transient — this is what sets the RAM floor.
* **Crons** run in-process on `@nestjs/schedule` with advisory locks
  (`grey:settlement`, `grey:escrow-auto-release`, `grey:payment-reconciliation`,
  `grey:approval-expiry`), so they are safe if you ever do run two instances —
  they simply serialise.

There are already load tests to validate this rather than guess:
`loadtest/k6/browse.js` (50 VUs, p95 < 600 ms) and
`loadtest/k6/bidding.js` (100 bidders, bid p95 < 400 ms). Run both against
staging before launch (see §13).

### 4.3 Known single-instance ceilings (fix before scaling out — Scope 3)

| Limit | Today | Consequence | Fix |
|---|---|---|---|
| Socket.IO fan-out | in-process only, no `@socket.io/redis-adapter` | two instances = each client only sees events from its own instance | add the Redis adapter |
| Throttler storage | in-memory (`ThrottlerModule.forRoot`, no `storage`) | limits are per instance: N instances = N×100 req/min | `@nestjs/throttler` + Redis storage |
| BullMQ | needs Redis | without Redis, settlement runs inline (works, but a restart mid-settle is riskier) | set `REDIS_*` + `QUEUE_REQUIRED=true` |
| Sticky sessions | not configured | required for socket.io **polling** transport behind a load balancer | prefer `transports: ['websocket']`, or sticky cookies |

`[x]` **4.3.1** `trust proxy` is wired (`TRUST_PROXY`, defaults to 1 hop in
production) so `req.ip` is the real client behind Cloudflare/Traefik — without
it every visitor shares one rate-limit bucket and the audit trail logs the proxy.
`[x]` **4.3.2** The BFF proxy forwards `x-forwarded-for` and `x-request-id`
(`frontend/app/api/proxy/[...path]/route.ts`), so the same holds for calls that
arrive through Next.js.

---

## 5. Environment matrix

All 87 variables referenced by the code, grouped. "Prod" = value needed in
production. Everything is read at **boot** for the backend — a changed env var
needs a restart (frontend `NEXT_PUBLIC_*` need a **rebuild**, they are inlined).

### 5.1 Required, no default worth shipping

| Var | Prod | Purpose / gotcha |
|---|---|---|
| `JWT_SECRET` | `openssl rand -base64 32` | **app refuses to boot in production without it**. Rotating it invalidates every session and API token. |
| `DB_HOST` `DB_PORT` `DB_USERNAME` `DB_PASSWORD` `DB_DATABASE` | managed PG | |
| `FRONTEND_URL` | `https://greyauction.com` | used in emails, SMS, invite links, payment redirects |
| `CORS_ORIGIN` | `https://greyauction.com,https://www.greyauction.com` | comma-separated; also the socket gateway's allowed origin |
| `AUTH_SECRET` | `openssl rand -base64 32` | frontend; signs the session cookie. Different value from `JWT_SECRET`. |
| `NEXT_PUBLIC_API_URL` | `/api/proxy` | **must stay the relative path** — the BFF attaches the token; pointing it at the backend origin leaks the token to JS |
| `API_URL` | `http://backend:3001/api` | server-side only (proxy + server components) |
| `NEXT_PUBLIC_REALTIME_URL` | `https://api.greyauction.com` | sockets cannot ride the same-origin proxy; auth is a short-lived ticket |

### 5.2 Storage (R2) — see §6

| Var | Prod |
|---|---|
| `STORAGE_DRIVER` | `s3` |
| `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | R2 API token (Object Read & Write, scoped to the bucket) |
| `S3_BUCKET` | `grey-auction-public` |
| `S3_REGION` | `auto` |
| `S3_FORCE_PATH_STYLE` | `false` (R2 supports virtual-host addressing; `true` also works) |
| `S3_PUBLIC_HOST` | `cdn.greyauction.com` — keeps MinIO/R2 endpoints out of stored URLs |
| `S3_PRIVATE_BUCKET` | **not implemented yet** — see §6.3 P0 |

### 5.3 Operations

| Var | Prod | Why |
|---|---|---|
| `NODE_ENV` | `production` | flips migrations-on-boot, disables Swagger, enables the `JWT_SECRET` guard |
| `PORT` | `3001` | |
| `TRUST_PROXY` | `1` (or `2` with CF → Traefik → app) | client IP + audit correctness |
| `LOG_FORMAT` | `json` | what a log shipper can parse; `pretty` is for humans |
| `METRICS_TOKEN` | random | without it `GET /api/metrics` (business gauges: revenue, active users) is open |
| `DB_POOL_SIZE` | `20` | see §4.2 |
| `REDIS_HOST` `REDIS_PORT` `REDIS_PASSWORD` | managed Redis | queues |
| `QUEUE_REQUIRED` | `true` | fail loudly instead of silently degrading to inline settlement |
| `SELLER_APPROVAL_WINDOW_HOURS` | `72` | policy |
| `PAYOUT_BANK_HOLD_HOURS` | `48` | payout-account rest window |
| `DB_BACKUP_ENABLED` | `true` | see §7.4 |
| `DB_BACKUP_S3_PREFIX` / `DB_BACKUP_KEEP_DAYS` / `DB_BACKUP_TMP_DIR` / `DB_BACKUP_ALERT_WEBHOOK_URL` | `db-backups` / `14` / `/tmp/greyauction-backups` / Slack webhook | |

### 5.4 Payments — see §10

`PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`,
`FLUTTERWAVE_WEBHOOK_HASH`, `INTERSWITCH_*` (5 vars), `OPAY_*` (4 vars),
`PAYMENT_WEBHOOK_URL`, `PAYMENT_PROVIDERS_DISABLED`.

`[ ]` Ship with `PAYMENT_PROVIDERS_DISABLED=opay,interswitch` — those two cannot
verify their webhooks yet, and the app refuses them at checkout by design.

### 5.5 Notifications, auth providers, misc

`BREVO_API_KEY` (+ `BREVO_FROM`, `BREVO_CONTACT_LIST_ID`, or the
`BREVO_SMTP_*` relay), `SMTP_*` fallback, `TERMII_*` / `TWILIO_*` for SMS,
`GOOGLE_CLIENT_ID` (Google sign-in; unset ⇒ 401 by design),
`EXCHANGE_RATE_API_URL` (unset ⇒ seeded static rates),
`ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` (first admin only — **change the
password immediately**), `TYPESAFE_*` + `MODERATION_*` if the listing-moderation
agent is enabled.

### 5.6 Frontend-only

`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_IMAGE_HOSTS` (`cdn.greyauction.com`),
`NEXT_PUBLIC_USE_MOCK_FALLBACK` (**must be unset in production** — it renders
mock lots/categories when the API is down, which hides wiring bugs),
`NEXT_PUBLIC_PWA_DEV` (dev only).

`[ ]` **5.7** Secrets live in the host's secret store (Coolify secrets / Docker
secrets / Doppler / 1Password CLI), never in the image, never in `docker-compose`
defaults. `docker-compose.coolify.yml` currently ships fallbacks like
`POSTGRES_PASSWORD:-postgres` — override them or delete the defaults.

---

## 6. Object storage on Cloudflare R2

### 6.1 Why R2 fits

The storage layer is already an abstraction:
`backend/src/common/storage/` has `local` and `s3` drivers, chosen by
`buildStorageDriver()` from `STORAGE_DRIVER`. Moving to R2 is an **env change
only** — no code, no rebuild. Uploads are optimised to WebP plus three
responsive variants (`ImageOptimizerService`), keys are
`<folder>/<timestamp>-<random>[-<variant>].webp`, and every URL is built from
`S3_PUBLIC_HOST`, so stored rows survive a bucket/CDN change.

### 6.2 Bucket plan

| Bucket | Contents | Access | Cache |
|---|---|---|---|
| `grey-auction-public` | `images/*`, `products/*` (lot photos & lot documents intended to be public) | custom domain `cdn.greyauction.com`, R2 public access | `public, max-age=31536000, immutable` (keys never change) |
| `grey-auction-private` | `kyc/*`, `documents/*` (identity documents, seller paperwork) | **no public access**; reads only via short-lived presigned URLs | `private, no-store` |
| `grey-auction-backups` | `db-backups/*` | private; lifecycle rule | — |

`[ ]` **6.2.1** Create both buckets; create an R2 API token scoped to both.
`[ ]` **6.2.2** Connect `cdn.greyauction.com` to the public bucket.
`[~]` **6.2.3** Lifecycle rule on the backups bucket: delete after 30–35 days
(the service keeps 14 days locally; remote retention is the object store's job —
see `docs/DB_BACKUPS_RUNBOOK.md`).
`[ ]` **6.2.4** CORS on the public bucket: `GET`/`HEAD` from
`https://greyauction.com` only (images render without CORS, but any canvas or
fetch-based use will need it).

### 6.3 P0 — identity documents must not be in a public bucket

**This blocks a compliant public launch.** Today every upload goes through the
same `StorageService.uploadFile(file, folder)` into the same bucket, and the
Coolify stack makes that bucket anonymously readable
(`mc anonymous set download`). KYC documents (`kyc/`) and seller documents
(`documents/`) are therefore fetchable by anyone who learns the URL — the URLs
are stored on the row and returned in API responses. Lot images *must* be public;
passports must not be.

Two options:

* **A — two buckets + signed reads (recommended).** Add
  `S3_PRIVATE_BUCKET` to `storage.module.ts`; give `put()` a visibility, and add
  `getSignedUrl(key, ttl)` to `StorageDriver` (`@aws-sdk/s3-request-presigner`).
  Uploads to `kyc`/`documents` go to the private bucket; the read paths
  (`kyc.controller`, `seller.controller` documents, `product-document.controller`)
  return presigned URLs with a 5–10 min TTL instead of the stored URL. Store the
  **key**, not the URL, so the TTL is generated per request.
* **B — keep one bucket, serve everything through the API.** No public bucket at
  all; an authenticated `GET /api/files/*` streams from R2. Simplest access
  model, worst latency and egress through the app — acceptable at low volume.

Effort: A ≈ 1 day (driver + presigner + 3 read paths + migration of the URL
column to a key + tests). Do it in Scope 1, before real users upload documents.

`[ ]` **6.3.1** Interim mitigation if launch cannot wait: keep
`STORAGE_DRIVER=local` for documents (the local driver is not web-served outside
`/uploads`, which you can block at the edge) and `s3` only for images. Ugly, but
it does not expose identity documents.

### 6.4 Migration of existing objects

`[ ]` **6.4.1** If dev/staging has objects on local disk: `rclone sync uploads/
r2:grey-auction-public/images` (or `mc mirror`). Keys are already
folder-prefixed, so no rewriting is needed as long as `S3_PUBLIC_HOST` matches
the old `/uploads` prefix mapping.
`[ ]` **6.4.2** Any row still holding a `http://minio:9000/...` URL will break in
production: run `UPDATE ... SET url = replace(url, 'http://minio:9000/greyauction', 'https://cdn.greyauction.com')`
per table (`product_images`, `product_documents`, `kyc_documents`,
`seller_documents`). **Verify the column names before running** — prefer the
key-not-URL model from §6.3.

---

## 7. Database

`[ ]` **7.1 Choose the host.** Managed (Neon, Supabase, RDS, Azure Flexible) vs
container on the same box. Managed buys you PITR and failover; a container is
cheap but you own the backups. Either way: same region as the app, TLS on,
`max_connections` sized to §4.2.

`[ ]` **7.2 Migrations, never `synchronize`.** `database.config.ts`: production
sets `synchronize=false` unless `DB_SYNCHRONIZE=true` (a one-time bootstrap for
a brand-new database) and `migrationsRun=true`, so migrations apply **at boot**.
Seven migrations exist under `backend/src/database/migrations/`. Procedure:
`DB_SYNCHRONIZE=true` on the *very first* deploy (or run
`npm run migration:run` against an empty database) → then remove the flag and
let `migrationsRun` handle every later deploy. Read
`docs/DB_MIGRATIONS_RUNBOOK.md` before touching this.

`[ ]` **7.3 Seed once**, then harden: `npm run seed:admins:dev` with
`ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`, log in, change the password, and note
that `admin@test.com` is intentionally linked-but-unverified (it exercises the
privileged-access gate).

`[ ]` **7.4 Backups** — already built, just arm it:
`DB_BACKUP_ENABLED=true` + the `S3_*` creds + `pg_dump` on `PATH` (the backend
image installs `postgresql16-client`). It streams `pg_dump | gzip` to R2 on a
cron, keeps 14 days locally, and can notify a webhook on failure.
`[ ]` **7.4.1 Restore drill before launch** — `docs/DB_BACKUPS_RUNBOOK.md` has
the steps; restoring into a *fresh* database and spot-checking the money tables
is the only proof the backups are real.

`[>]` **7.5** After launch: read replica for reporting, `pg_stat_statements`,
and a `pgbouncer` once replica count × pool approaches `max_connections`.

---

## 8. Redis and background work

`[ ]` **8.1** Provision Redis 7 with `maxmemory-policy noeviction` (evicting
BullMQ keys loses jobs) and a password. **One instance serves both** the queue
and (later) the socket adapter — share it, do not run two.

`[ ]` **8.2** `QUEUE_REQUIRED=true` in production: settlement, escrow release
and payouts should refuse to run inline rather than risk a half-applied
settlement on restart.

`[ ]` **8.3** Redis is **not** a cache here — nothing will silently get faster.
If you later want response caching, that is Cloudflare's Cache Rules (§11), not
Redis.

---

## 9. Scaling rules (read before adding a second backend)

1. **Sockets first.** Add `@socket.io/redis-adapter` to `AuctionGateway` and
   `ChatGateway`, or run exactly one backend. There is no adapter today.
2. **Rate limits second.** `ThrottlerModule` has no shared storage; move it to
   Redis, or the effective limit becomes N×100/min per IP.
3. **Then sticky sessions.** If clients keep the default polling transport, the
   LB needs cookie affinity. Simpler: force `transports: ['websocket']` on the
   server so affinity is unnecessary.
4. **Then the pool.** `pool × instances < 0.8 × max_connections`.
5. **Frontend** scales linearly with no shared state (JWT sessions, no session
   table) — it is the safe thing to scale first.

---

## 10. Payments, webhooks and email

`[ ]` **10.1** Paystack: `PAYSTACK_SECRET_KEY`; register the webhook
`https://api.greyauction.com/api/payments/webhook/paystack`. The handler
verifies `x-paystack-signature` over the **raw** body (`rawBody: true` in
`main.ts`) and fails closed.
`[ ]` **10.2** Flutterwave: `FLUTTERWAVE_SECRET_KEY` +
`FLUTTERWAVE_WEBHOOK_HASH` (the `verif-hash` you register).
`[ ]` **10.3** Keep `PAYMENT_PROVIDERS_DISABLED=opay,interswitch` until their
signature schemes are implemented — otherwise a buyer pays and the confirmation
is rejected, leaving an order that never settles.
`[ ]` **10.4** `PAYMENT_WEBHOOK_URL=https://api.greyauction.com/api/payments/webhook`
— must be publicly reachable, **not** behind Access/Turnstile.
`[ ]` **10.5** WAF: create a **Skip** rule for `URI Path starts with
/api/payments/webhook/` (Bot Fight Mode and managed rules must never challenge
gateway callbacks). Verify with a live test payment — a challenged webhook looks
exactly like a signature failure.
`[ ]` **10.6** Email: Brevo API key (preferred) or the SMTP relay; then publish
**SPF, DKIM and DMARC** for `greyauction.com`. Without DKIM, invoices and
password resets land in spam — which for this product reads as "the platform
does not work". Warm the domain before a launch campaign.
`[ ]` **10.7** SMS: Termii (primary) or Twilio fallback; register the sender ID
(`TERMII_SENDER_ID`); note Nigerian sender-ID approval takes days — start early.

---

## 11. Edge configuration (Cloudflare) — exact rules

**Order inside Cloudflare:** WAF/Bot → Cache → Origin. Configure in this order or
you will chase phantom 403s.

`[ ]` **11.1 Cache Rules**
* *Bypass* (do not cache): `/api/*`, `/auth/*`, `/admin/*`, `/seller/*`,
  `/buyer/*`, `/checkout/*`, `/cart/*`, `/wishlist/*`, `/room/*`, `/invite/*`
  (these are all session-dependent — cached HTML here leaks one user's pages to
  another).
* *Cache eligible*: `/` , `/_next/static/*`, `/images/*`, `/car.svg`, fonts.
  Edge TTL "respect origin headers"; browser TTL as origin.
* `cdn.greyauction.com` (R2 custom domain): cache everything, long TTL — object
  keys are immutable.

`[ ]` **11.2 Rate limiting rules** (edge, before the app):
* `/api/auth/login` — e.g. 10 requests / minute / IP.
* `/api/auth/register`, `/api/auth/send-otp`, `/api/auth/forgot-password` —
  5/minute/IP.
* `/api/payments/init` — 20/minute/IP.
* Everything else: leave to the app's 100/min global limit.
Keep the edge limits *looser* than the app's so the app remains the authority and
you never debug "the origin says 200 but the edge said 429".

`[ ]` **11.3 Headers.** The app already sets a strict CSP (`next.config.ts`:
`default-src 'self'`, `object-src 'none'`, `frame-ancestors` via helmet on the
API). Cloudflare must **not** inject scripts (no Rocket Loader, no "Web
Analytics" beacon) — the CSP blocks them and the page silently loses features.
If you want CF Web Analytics, add its origin to `script-src` deliberately.

`[ ]` **11.4** Do not enable "Under Attack" mode during a normal launch: it
challenges websockets and the BFF proxy.

`[>]` **11.5** Workers (later) for redirects `www → apex`, extra security
headers, and serving a maintenance page from the edge while the origin restarts.

---

## 12. Staging

`[~]` **12.1** A second stack — `staging.greyauction.com` +
`staging-api.greyauction.com` — with its **own** database, Redis namespace and R2
prefix/bucket, and **test** payment keys (or
`PAYMENT_PROVIDERS_DISABLED=paystack,flutterwave,interswitch,opay` to take no
money at all).
`[~]` **12.2** Put Cloudflare **Access** in front of staging so it is never
public.
`[~]` **12.3** Staging is where migrations are rehearsed against a restored
production dump — never first-run a migration in production.

---

## 13. Pre-launch verification (the gate)

Run in this order; do not skip 4.

1. `[ ]` **Endpoint sweep** — `node tools/audit/probe-all.js` against the deployed
   staging API (it walks every operation in the live OpenAPI document with
   anonymous, buyer, seller and admin tokens; writes are probed anonymously only,
   so nothing mutates). **Exit code 0 = clean.** This is how the crashed admin
   dashboard and the unscoped invite listings were found. Point it at staging,
   not production: `/api/docs-json` is disabled in production.
2. `[ ]` **Automated gates** — `cd backend && npm run build && npx jest &&
   npm run lint` (53 suites / 432 tests, 0 errors) and `cd frontend && npx tsc
   --noEmit && npm run lint && npm test && npm run build` (85 tests).
3. `[ ]` **Load** — `k6 run -e VUS=200 -e DURATION=3m loadtest/k6/browse.js`
   (p95 < 600 ms) and `k6 run -e BIDDERS=200 loadtest/k6/bidding.js`
   (bid p95 < 400 ms) against **staging**, watching DB connections and memory.
4. `[ ]` **Restore drill** — restore the latest R2 dump into a fresh database and
   check `invoices`, `escrow_holds`, `wallet_transactions` reconcile.
5. `[ ]` **Money smoke test** — with a live test key: pay one invoice end to end,
   confirm the escrow hold splits `sellerNet + platformShare + vat = total`, then
   refund it and confirm the hold unwinds.
6. `[ ]` **Lighthouse** — `npx @lhci/cli autorun --config=loadtest/lighthouse/lighthouserc.json`
   (performance ≥ 0.9, LCP ≤ 2.5 s). Re-run **through Cloudflare**, not just
   against localhost: caching changes the numbers.
7. `[ ]` **Upload round-trip** — one image (expect 4 objects: original + 3
   variants, all WebP) and one PDF; confirm the public URLs load from
   `cdn.greyauction.com` and that a KYC document does **not**.
8. `[ ]` **Backups armed** — `DB_BACKUP_ENABLED=true`, then confirm a dump
   appears under `db-backups/` in R2 the next morning.
9. `[ ]` **Observability** — `GET /api/health` (DB-free liveness) wired to an
   external uptime check; `/api/metrics` scrapeable with `METRICS_TOKEN`; a 5xx
   alert; logs arriving in `json`.
10. `[ ]` **Rollback rehearsed** — know the previous image tag and the exact
    command to redeploy it.

---

## 14. Build plan — by scope

### Scope 0 — deployable now, no new code, no new keys

Everything needed to stand the stack up on a host behind Cloudflare:

1. Provision the host(s), Postgres, Redis (§4, §7, §8).
2. Create the R2 buckets + API token; set `STORAGE_DRIVER=s3` (§6.2).
3. Point DNS at the origin, Full (strict), HSTS later (§3).
4. Fill the env matrix (§5) from the secret store; `NEXT_PUBLIC_USE_MOCK_FALLBACK`
   unset; `PAYMENT_PROVIDERS_DISABLED=opay,interswitch`.
5. Build and run the two images (the Dockerfiles in the repo work; fix noted in
   §16.1 is already applied).
6. First boot with `DB_SYNCHRONIZE=true` **or** an empty database +
   `npm run migration:run`; then remove the flag.
7. Seed the admin, change the password.
8. Cache Rules + rate limits + webhook skip (§11, §10.5); arm backups (§7.4).
9. Run the §13 gate.
10. Invite-only soft launch (one seller, one buyer, one lot) before opening up.

**What you can accept as-is:** storage abstraction, backups, health/metrics,
cron locks, JWT sessions, structured logs, the BFF token model.

### Scope 1 — before opening to the public

| # | Item | Why it blocks a public launch | Effort |
|---|---|---|---|
| 1 | **Private bucket for KYC/documents + presigned reads** (§6.3) | identity documents must not be world-readable | ~1 day |
| 2 | **Cache-Control on uploads** — `put()` sets neither `CacheControl` nor `ContentDisposition`; add `public, max-age=31536000, immutable` for public objects and `private, no-store` + `attachment` for documents | without it, CDN hit-rate is poor and PDFs open inline | ~1 hour |
| 3 | **Turnstile** on register / forgot-password / contact | the app-level throttle is one bucket and bypassable by rotating IPs | ~half day |
| 4 | **KYC publishing gate messaging surfaced in the admin UI** | the gate returns 403 with the remedy; the screen should explain it before the click | ~2 hours |
| 5 | **Seed categories** (`categories` is empty ⇒ empty navigation) | first-run looks broken | ~2 hours |
| 6 | **Payment provider completion** — OPay/Interswitch webhook signatures | two checkout options stay dark | external docs + ~1 day each |
| 7 | **Bank-account name enquiry** | payouts can go to an account that is not the seller's | needs a PSP resolve-account key |
| 8 | **Load-test-driven sizing** confirmed on production hardware | first real auction is the stress test otherwise | ~half day |

### Scope 2 — leverage Cloudflare further

| Item | Payoff |
|---|---|
| Cloudflare **Access** on `/admin/*` and staging | a second, identity-provider-level gate in front of the highest-privilege surface |
| **Tiered cache / Cache Reserve** for `cdn.` | lower origin egress, better TTFB globally |
| **Workers** for apex redirect + security headers + maintenance page | originless redirects, graceful deploys |
| **Logpush → R2** (plan-dependent) | edge + origin logs in one queryable place |
| **Bot Management** tuning from real traffic | cut scraping of lot data and bid manipulation attempts |
| **R2 event notifications → Queue** | async thumbnailing/virus scanning off the request path |

### Scope 3 — scale-out prep

1. `@socket.io/redis-adapter` + websocket-only transport (or sticky sessions).
2. Throttler backed by Redis.
3. Second backend replica behind a load balancer; `pgbouncer` if replicas ≥ 3.
4. Read replica for admin reporting/KPIs.
5. Cloudflare Images (or keep sharp — it works) once volume justifies cost.
6. Split the settlement/escrow workers into their own process (they are already
   queue-ready) so a web deploy never interrupts a settlement run.

---

## 15. Open decisions

| # | Decision | Needed by |
|---|---|---|
| 1 | Managed Postgres vs container-on-box (cost vs PITR/failover) | Scope 0 |
| 2 | Tunnel vs direct A record for the origin | Scope 0 |
| 3 | Two buckets (A) vs everything through the API (B) for documents (§6.3) | Scope 1 |
| 4 | Whether `api.greyauction.com` is public or restricted to CF IPs | Scope 1 |
| 5 | Retention policy for KYC documents (legal, not technical) | Scope 1 |
| 6 | Which providers go live first (Paystack only is fine) | Scope 1 |

---

## 16. Appendix — known traps in this repo

**16.1 `dist/main` vs `dist/src/main`.** Nest emits `dist/src/main.js`; the stray
`backend/Dockerfile` used `node dist/main` and would crash on start. Fixed; if
you add a new Dockerfile, copy `Dockerfile.backend`.

**16.2 The BFF path is load-bearing.** `NEXT_PUBLIC_API_URL` must remain
`/api/proxy`. Pointing it at the API origin puts a bearer token in client
JavaScript — the exact thing the proxy exists to prevent.

**16.3 Cookie flags.** Auth.js sets the session cookie; with TLS terminated at
Cloudflare the browser still sees HTTPS, so `Secure` cookies work — but only if
the origin is served over HTTPS too (Full strict). *Flexible* SSL produces a
login loop.

**16.4 Webhooks see the raw body.** `rawBody: true` is required for signature
verification. Any proxy or WAF that rewrites the body breaks every payment. Do
not put a Worker in front of `/api/payments/webhook/*`.

**16.5 `DB_SYNCHRONIZE=true` is a one-shot.** Leaving it on in production lets
TypeORM reshape tables from entities and silently drop data.

**16.6 Prod has no Swagger.** `/api/docs` and `/api/docs-json` are
development-only. Generate the client types (`npm run generate:api` in
`frontend`) against staging, not production.

**16.7 Common Cloudflare errors**

| Symptom | Cause | Fix |
|---|---|---|
| 521 / 522 / 524 | origin down, or the request took longer than the edge timeout | check the container; 524 = slow query, not a CF problem |
| 525 / 526 | TLS mode/direction wrong | Full (strict) + valid origin cert |
| Login loop | Flexible SSL, or `CORS_ORIGIN` missing the real host | Full (strict); fix `CORS_ORIGIN` |
| Webhooks "invalid signature" | a WAF/Bot challenge answered instead of the origin | add the skip rule (§10.5) |
| Sockets connect then drop | `/socket.io` cached, or an idle timeout below 25 s | bypass cache, check keepalive |
| Images 403 from `cdn.` | bucket public access off / custom domain not connected | R2 settings §6.2 |
| Everything 429 at once | one rate-limit bucket → `TRUST_PROXY` not set | set `TRUST_PROXY=1` |

# GreyAuction — Engineering Handoff

_Checkpoint: end of session day 3 (2026-09-08, G-roadmap wave: G33 newsletter wired · G34 SEO fixed+extended · G50 structured logging · G51 DB backups · +P1 OTP-leak security fix). Head see git log —
**everything PUSHED**: `origin/master` = `origin/main` (main is a manual mirror — re-sync with `git push origin master:main` after future pushes).
Suites: FE/BE tsc clean · vitest **84/84 (18 files)** · jest **310/310 (46 suites)** · Playwright **55/55 (0 flakes)**. Catalogs **1552 keys ×3 locales**, strict parity. Full audit ledger: `docs` trackers._

## Repo & environment

- Repo: `C:\Users\Ebele John\Desktop\Greay-Auction-A!\extracted\Grey-Auction-master` (branch `master`, remote `origin`).
- Frontend: Next.js 16 (Turbopack) + Tailwind v4 + Redux Toolkit + next-intl. Port **3000** (`npm run dev`).
- Backend: NestJS. Port **3001** (`npm run start:dev`, `/api` prefix, Swagger `/api/docs`).
- DB: Postgres in docker **`greyauction-postgres`**, db `greyauction`, port **5433**. Dev uses `synchronize: true`.
- ⚠️ If ports 3000/3001 refuse connections after a machine restart: start **Docker Desktop**, then
  `docker start greyauction-postgres`, then start backend + frontend. A backend started before Postgres stays wedged — restart it.

## Session gotchas (learned the hard way — read before debugging)

- **`next dev` does NOT hot-reload `messages/*.json`** — after any catalog edit, restart the
  frontend or pages serve stale strings (or 500 if a mid-edit catalog is picked up).
- **Never re-save the JSON catalogs with PowerShell 5.1** (`Set-Content -Encoding UTF8` adds a BOM
  and double-encodes accents). Edit with the file tools or node only. If you see `Ã‰/â€¦/â€"` in
  rendered strings, that's cp1252 mojibake — repair with a byte-level node pass, not find/replace.
- **The backend watcher can die silently between sessions** — if Playwright auth-minting, seeded-lot
  specs, or the homepage a11y scan fail all at once, check `GET http://localhost:3001/api/health`
  before blaming the frontend. Restart with detached `npm run start:dev`.
- Playwright runs with `workers: 2`; a single auth-mint flake that passes on retry is contention,
  not a regression (retries absorb it — exit code is what counts).
- **An expired auth storageState does NOT redirect — it empties.** Pages whose data comes from
  JWT-guarded SSR fetches (e.g. the admin AI console) render their empty state ("No Providers")
  instead of erroring, so specs asserting data visibility fail mysteriously. Re-mint
  (`node scripts/_make-auth.js`) before blaming the code. (Hit 2026-09-05 on `ai-admin.spec.ts`.)
- **This network poisons GitHub DNS** — `github.com` resolves to a bogus IP (20.26.156.215) even
  via 1.1.1.1/8.8.8.8 (interception), so `git push` fails with "Could not resolve/connect". Real
  GitHub IPs ARE reachable with valid TLS. Workaround (no admin needed, git ≥2.44): pin the IP —
  `git -c http.curloptResolve="github.com:443:140.82.112.3" push origin master`
  (also works: 20.205.243.166; connections are ~50% flaky — retry the loop, rotate IPs). This is
  why commits piled up unpushed across sessions.
- **TypeORM phantom drift on numeric defaults** — a `migration:generate` probe after a clean run
  can emit `ALTER ... SET DEFAULT '7.5'` (quoted) forever, because Postgres stores quoted vs
  unquoted numeric defaults differently than TypeORM normalizes. Fix: hand-edit the migration to
  unquoted literals (`SET DEFAULT 7.5`) — done in `SyncEntities1789200000000`.
- **Migration timestamps are an ordering contract** — hand-authored chain migrations carry future
  timestamps (`1789050000000`, `1789150000000`); new work must sort ABOVE `1789200000000` or
  re-stamp, else a generated migration slots mid-chain and fails (42P07 already-exists).
- **Migrations exist (pendingwork said otherwise)** — chain: Baseline → AddOrders → U5FeeRules →
  CreateSettings → SyncEntities. Full details: `docs/DB_MIGRATIONS_RUNBOOK.md`.

## Test accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@greyauction.com | Admin@12345 |
| Seller | demo@seller.com | Seller@12345 |
| Buyer | demo@buyer.com | Buyer@12345 |

## Current suite state (verified end of session)

```bash
cd frontend
npx tsc --noEmit        # clean
npx vitest run          # 84/84 (18 files)
npx playwright test     # 55/55 (see stale-auth gotcha above)
cd ../backend && npx jest   # 310/310 (46 suites)
```

(2026-09-08: also verified live — /robots.txt + /sitemap.xml serve with all-locale
URLs; subscribe→confirm round-trip OK; admin backup endpoints guarded; login wire
body free of otpCode.)

Playwright notes:
- Cookie-consent banner is pre-accepted via `frontend/playwright/.auth/public.json`.
- Auth'd specs use `frontend/playwright/.auth/{admin,seller,buyer}.json`. If missing/expired:
  `cd frontend && node scripts/_make-auth.js`.
- `docs/QA_STATUS.md` has the full suite map.

## What was delivered (this session, newest first)

### Day 3 (2026-09-08) — G-roadmap wave + security fix (see git log for hashes)

- **SECURITY (P1, found & fixed during verification):** `AuthService.sanitizeUser`
  spread the entity into a PLAIN object — the `@Exclude` metadata on
  `otpCode/otpExpiry` does not survive that, so **live pending OTP codes were on
  the wire in every `/auth/*` response** (login/register/oauth/reset/… — 8 call
  sites). Rewritten as an explicit whitelist projection + 2 regression specs
  (auth suite 27→29). Wire-verified: `otpCode` gone from raw login body.
  `passwordHash` was always safe (rest-destructured).
- **G34 SEO:** `app/sitemap.ts` + `app/robots.ts` EXISTED but were unreachable —
  the proxy matcher's static-file exclusion missed `xml`/`txt`, so the intl
  middleware treated `/sitemap.xml` as a locale-less page → redirect → 404.
  Matcher fixed. Sitemap rewritten: all 3 locales + hreflang alternates +
  live auction slugs (21 slugs locally; was EN-only), pure logic in
  `lib/sitemap-routes.ts` + 4 vitest specs. Robots now disallows dashboards/
  auth/api (bare + `/*/` locale-prefixed) and declares the sitemap.
- **G33 Newsletter:** footer `NewsletterForm` was a localStorage MOCK — now
  POSTs `/api/subscriptions` (backend double opt-in was already built), all
  strings via `footer.newsletter.*` ×3 locales (catalogs 1545→1552, parity
  re-validated via node key-walk). E2E-verified round-trip: subscribe→pending→
  emailed token→`/subscriptions/confirm`→confirmed→probe row cleaned.
- **G50 Logging:** `StructuredLoggerService` (Nest LoggerService) registered via
  `app.useLogger` + `bufferLogs`. `LOG_FORMAT=json` or prod → single-line JSON
  `{ts,level,ctx,msg,requestId}`; dev stays human. requestId correlation via new
  `AsyncLocalStorage` store opened in the existing `RequestIdMiddleware` — zero
  call-site plumbing. AllExceptionsFilter 5xx now also POSTs to
  `ERROR_WEBHOOK_URL` (Slack/Discord-shaped, 5s timeout, never-throws). Sentry
  SDK intentionally NOT installed (needs DSN — env-gated webhook covers
  alerting; SDK is a small follow-up). 4 new specs.
- **G51 Backups:** `DatabaseBackupService` — daily 02:00 UTC
  `pg_dump → gzip → S3 (PutObject, AES256)` via the existing S3_* storage-driver
  config, `db-backups/<ISO>.sql.gz`, tmp retention `DB_BACKUP_KEEP_DAYS=14`,
  failure alert `DB_BACKUP_ALERT_WEBHOOK_URL`, boot warning on half-config.
  HARD-GATED: inert unless `DB_BACKUP_ENABLED=true` AND S3 creds (4 gating
  specs). SUPER_ADMIN endpoints: `POST /api/admin/backups/run`,
  `GET /api/admin/backups/config` (verified: anon 401, disabled-skip 200).
  Dockerfile runtime stage adds `postgresql16-client`. Runbook:
  `docs/DB_BACKUPS_RUNBOOK.md` — arm by setting env in Coolify (see Pending).

### Day 3 new gotchas
- **Metadata routes vs proxy matcher:** any new `/x.xml`/`/x.txt`-style route is
  invisible while the intl middleware claims it — if you add such a route, it
  must be in `frontend/proxy.ts` config.matcher exclusions (now includes xml/txt).
- **Entity `@Exclude` lies for plain objects:** ClassSerializerInterceptor only
  acts on real class instances. Any `{...entity}` / destructure-spread in a
  service return bypasses EVERY `@Exclude`. Auth responses now use explicit
  whitelists — copy that pattern for new user projections.
- `vitest` and `playwright` running concurrently produce TIMEOUT flakes in
  jsdom-heavy suites (exchange-rates panel failed at 11s under load, green
  alone) — run suites sequentially when both are due.

### Day 2 (2026-09-05) — carried from previous checkpoint

- `7c6cb75` docs: trackers updated (G48 validation, G49 rollout, D1 prep, D6 closure)
- `3ecaef1` feat(db): SyncEntities migration + `docs/DB_MIGRATIONS_RUNBOOK.md` (D1 prep)
- `c045a6d` feat(security): tight rate limits on anonymous auth endpoints (G49)
- `4fa1ff7` i18n(common): DataTable tab-filter labels (row-20 residue)
- `b337bf2` docs: GitHub DNS-poisoning push workaround (see gotchas)
- `93af2b6` docs: wave-3 session close-out (checkpoint, audit row 20, checklist)
- `6ce225c` i18n(admin): admin list-table chrome across all five domains (auctions/bids/buyers/sellers/tickets;
  column-hook factories, detail modals incl. approve/reject confirmations, spec dialogs model-as-keys;
  catalogs 1534 keys ×3 locales)
- `332d47e` i18n(buyer): wishlist module (buyer.wishlist)
- `e8920a4` i18n(admin): admin settings modules (admin.settings, 353 keys)
- `d8072e3` i18n(seller): seller settings modules (seller.settings, 173 keys)
- `521ac5e` i18n(buyer): buyer settings tabs (buyer.settings, 86 keys)
- `2593a07` i18n(buyer): buyer wallet flows (buyer.wallet, 173 keys)
- `35d1d47` refactor(security): shared USER_PUBLIC_SELECT projection (response-DTO pass)
- `d59fc8a` + `11e23b8` server-served arm-tab counts endpoint + URL-scoped server filtering
- `6ec110a` EmptyState sweep completion (contextual empty state on room-creation auctions step)
- `2a17cd1` docs: U5 runbook Phase 8 (OPay/Interswitch sandbox pass)
- `51402a5` docs: dashboard home i18n recorded in audit + handoff
- `ab10366` i18n(admin): admin dashboard home (admin.home, 28 keys)
- `5c1764a` i18n(seller): seller dashboard home (seller.home, 33 keys)
- `fd278c7` i18n(buyer): buyer dashboard home (buyer.home, 26 keys)
- `b19bc9d` docs: dashboard i18n batch recorded
- `ef2c5a2` i18n: dashboard nav sidebars (buyer/seller/admin.nav, 33 keys) + cp1252 mojibake repair
- `c1440fd`..`06b7d4a` wave 3 + wave 2 chain: rooms PII projection, website chrome i18n
  (header/footer/mobile-menu), shared EmptyState adoption, payments/settings/tickets/ops hardening,
  checkout invoice wiring, theme FOUC + CSP, docs. (See `git log` and PRODUCTION_AUDIT.md.)

## i18n architecture (established patterns — reuse these)

- Catalogs: `frontend/messages/{en,fr,nl}.json`, strict key parity (validated every batch).
- Namespaces: `header`, `footer`, `common` (now includes `viewAll`), `auth`, `bidding`, `checkout`,
  `dashboard`, `buyer` (`nav` 12 + `home` 26 keys), `seller` (`nav` 10 + `home` 33), `admin`
  (`nav` 11 + `home` 28 + legacy flat keys + `exchangeRates`), plus pre-existing others.
- **Pattern 1 — model-as-keys**: label arrays (`BUYER_MODULES`, `SELLER_SETTINGS_MODULES`,
  `SETTINGS_MODULES`) carry catalog keys; the consuming sidebar calls `t(item.label)`.
- **Pattern 2 — column hook factories**: table column arrays became `useXColumns()` hooks so
  headers resolve per locale (applied to buyer home ×2, seller listed auctions, admin pending requests).
- **Pattern 3 — inline chart configs**: module-level `chartConfig` consts moved inside components
  so chart tooltips/legends translate (seller revenue, admin pies).
- **Pattern 4 — ICU params**: `{name}`/`{percentage}`/`{code}` interpolation instead of string concat.
- Verification recipe per slice: `tsc` → `vitest run` → **restart frontend** → authenticated
  Playwright probe with storageState asserting localized strings + no raw `ns.key` leaks in all 3 locales.
- Deliberately NOT translated: mock row data (dummy auctions/invoices), CATEGORIES_MAP category
  values, LOCALE_LABELS language names (own-language convention).

## Continue tomorrow — backlog in priority order

1. **⏸ OPay/Interswitch sandbox verification** — code-complete + unit-covered; blocked ONLY on the
   user providing sandbox keys (`OPAY_*`, `INTERSWITCH_*`, webhook secrets). On arrival: execute
   Phase 8 of `docs/PHYSICAL_TEST_U5.md`, closes audit row 23.
2. **D1 prod cutover — migrations** — PREP DONE: validated 5-migration chain committed,
   zero-drift verified; follow `docs/DB_MIGRATIONS_RUNBOOK.md` **Path B** (stamp 4 historical
   migrations on the bootstrap-created prod DB, then deploy so `SyncEntities` applies on boot).
   Needs: user confirms the auto-deploy picked up `7c6cb75`, ideally a Coolify token/SSH so the
   agent can execute + verify. Backup → stamp → deploy → verify per runbook.
3. **Verify prod redeploy health** — Auth.js 500 (D2) should be gone after the `7c6cb75` deploy
   (D3's force-rebuild). Ask the user; fix-forward if it persists (env vars in Coolify + rebuild).
4. **Enable GitHub Actions** (user click) — workflow `.github/workflows/ci.yml` is committed and
   FE-build-validated backend-less; first push after enabling proves the pipeline.
5. **Physical U5 test runbook** (`docs/PHYSICAL_TEST_U5.md`) — Phases 1–7 on-device pass with the
   user (~1–2 h, agent guides + logs results); Phase 8 needs item 1.
6. **i18n leftovers** (low priority): status-badge enum values are deliberately raw (DB data);
   mock-data values remain. Only revisit if the user wants enum values localized too.
7. **Day-3 follow-ups** (G-wave leftovers):
   - **Arm G51 backups in prod** (⏸ user, 5 min): set `DB_BACKUP_ENABLED=true` +
     `S3_ACCESS_KEY/SECRET/BUCKET` (and optional alert webhook) in Coolify per
     `docs/DB_BACKUPS_RUNBOOK.md`; then `POST /api/admin/backups/run` to prove the path.
   - **G50 Sentry SDK** — structured JSON logging shipped; @sentry/node is a small add
     once the user chooses a project/DSN (or accepts webhook-only alerting).
   - **G33 Brevo sync** — set `BREVO_CONTACT_LIST_ID` alongside `BREVO_API_KEY` to
     mirror confirmed subscribers into the marketing list.
   - **G42 fraud detection** — the only day-3 gap still un-started (rules-based
     velocity/pattern checks; quick design consult advised before building).
   - **G34 optional polish** — Organization/WebSite JSON-LD on home, dynamic OG images.
   - Day-3 delivered: G33 (footer wired), G34 (fixed + all-locale), G50 (logging),
     G51 (backups) + the sanitizeUser OTP-leak P1 security fix.

## Feature state (what works today)

- **Institutional-arm tabs**: `/auctions?category=Government` shows All/Federal/State/Ministries/
  Parastatals/Agencies & Commissions/Security & Defence tabs with live counts; URL sync
  `&subcategory=…`; same for Embassy + Corporate. Taxonomy:
  `frontend/shared/data/categories.ts`.
- **3 themes** (Light/Grey/Dark) with pre-paint init script (no FOUC); persists via
  `localStorage['greyauction-theme']`.
- **Payments (U5 flow)**: Paystack live; escrow auto-hold; server-authoritative amount checks
  (webhook + reconciliation, fail-closed); fee chain product→seller→buyer→category→default.
  Don't touch the two U5 test lots (category `'art'`, direct_sale) or the two draft lots.
- **i18n**: en/fr/nl, 1552 keys ×3 locales — website chrome (incl. footer newsletter), all three dashboard navs + home
  surfaces, buyer wallet + settings, seller settings, admin settings, admin list-table chrome
  (auctions/bids/bids/buyers/sellers/tickets), shared tab-filter labels (see patterns above).
- **Wallet, bidding rooms (invites), tickets, chat, exchange rates, subscription plans, admin
  console**: built.
- **Newsletter (G33)**: footer + `/subscribe` → real double opt-in (`/api/subscriptions`,
  `/subscribe/confirm?token=`), `email_subscriptions` table, Brevo sync env-gated.
- **SEO (G34)**: `/robots.txt` + `/sitemap.xml` (3 locales, hreflang, live lot URLs),
  AuctionSchema JSON-LD + per-page metadata on detail pages.
- **Ops**: `LOG_FORMAT=json` structured logs with requestId correlation,
  `ERROR_WEBHOOK_URL` 5xx alerts, `/api/health`; DB backups env-gated — arm via
  `docs/DB_BACKUPS_RUNBOOK.md`.
- **AI**: fully built but disabled by design — no provider keys, features `isEnabled=false`.
  Enabling = add a key in Admin → AI and toggle features. No code needed.

## Conventions to keep

- Never commit generated logs (`*.log`), `test-results/`, or temp SQL files.
- The Next.js AGENTS.md/CLAUDE.md files in `frontend/` are auto-generated by `next dev` — leave
  them out of diffs (they re-create themselves when removed).
- Frontend tests: vitest colocated; e2e in `frontend/e2e/`. Backend: jest.
- U5 invariants: don't break fee field-claiming, escrow auto-hold, or `POST /orders/buy-now/:productId`.
- Locale catalogs: edit via file tools or node only (never PS5.1 re-save); keep en/fr/nl in lockstep;
  restart the dev server after catalog edits.
- After pushing `master`, re-sync the `main` mirror: `git push origin master:main`
  (created 2026-09-05 at user request; both at `7c6cb75`).
- Schema changes: edit entity → `npm run migration:generate -- src/database/migrations/<Name>` →
  review SQL → commit. **Never** set `DB_SYNCHRONIZE=true` in production (bootstrap flag retired
  at D1 cutover); prod applies pending migrations on every boot (`migrationsRun: true`).

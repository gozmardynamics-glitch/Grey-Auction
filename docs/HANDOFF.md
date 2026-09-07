# GreyAuction — Engineering Handoff

_Checkpoint: end of session day 2 (2026-09-05, evening). Head `7c6cb75` —
**everything PUSHED**: `origin/master` = `origin/main` = `7c6cb75` (main is a manual mirror — re-sync with `git push origin master:main` after future pushes).
Suites: FE/BE tsc clean · vitest 80/80 (17 files) · jest **300/300 (44 suites)** · Playwright 55/55 effective. Catalogs **1545 keys ×3 locales**, strict parity. Full audit ledger: `docs/PRODUCTION_AUDIT.md`._

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
npx vitest run          # 80/80 (17 files)
npx playwright test     # 55/55 effective (see stale-auth gotcha above)
cd ../backend && npx jest   # 300/300 (44 suites)
```

Playwright notes:
- Cookie-consent banner is pre-accepted via `frontend/playwright/.auth/public.json`.
- Auth'd specs use `frontend/playwright/.auth/{admin,seller,buyer}.json`. If missing/expired:
  `cd frontend && node scripts/_make-auth.js`.
- `docs/QA_STATUS.md` has the full suite map.

## What was delivered (this session, newest first)

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
7. **Bigger roadmap gaps** (from `pendingwork.md`, pick per user priority): G51 automated DB
   backups, G50 logging/Sentry, G33 newsletter, G34 SEO sitemap, G42 fraud detection.

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
- **i18n**: en/fr/nl, 1545 keys ×3 locales — website chrome, all three dashboard navs + home
  surfaces, buyer wallet + settings, seller settings, admin settings, admin list-table chrome
  (auctions/bids/bids/buyers/sellers/tickets), shared tab-filter labels (see patterns above).
- **Wallet, bidding rooms (invites), tickets, chat, exchange rates, subscription plans, admin
  console**: built.
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

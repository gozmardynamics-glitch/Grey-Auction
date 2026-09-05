# GreyAuction — Engineering Handoff

_Checkpoint: wave-3 session in progress (2026-09-05). Head at last doc commit — see `git log`.
**40+ commits ahead of `origin/master`, NOT pushed** (push needs explicit user go-ahead).
Suites at last full verification: tsc clean · vitest 80/80 · jest 296/296 (43 suites). Full audit ledger: `docs/PRODUCTION_AUDIT.md`._

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
npx playwright test     # 55/55 (1 known auth-mint contention flake, passes on retry)
cd ../backend && npx jest   # 293/293 (43 suites)
```

Playwright notes:
- Cookie-consent banner is pre-accepted via `frontend/playwright/.auth/public.json`.
- Auth'd specs use `frontend/playwright/.auth/{admin,seller,buyer}.json`. If missing/expired:
  `cd frontend && node scripts/_make-auth.js`.
- `docs/QA_STATUS.md` has the full suite map.

## What was delivered (this session, newest first)

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

1. **Deep dashboard detail i18n** (the layer below the dashboards' home surfaces). Targets, biggest
   first: buyer wallet flows (deposit/withdraw modals + their step components, PIN flows, receipt),
   buyer settings tabs (profile/security/notifications/payment), seller settings modules
   (my-profile, store, fees-payouts, plan-packages…), admin settings modules (fees.tsx is the
   heaviest file in the domain, general, preferences, roles…), admin list-table chrome
   (auctions/bids/buyers/sellers/tickets headers + filter buttons). Reuse patterns 1–4 above;
   add new namespaces per area (e.g. `buyer.wallet`, `admin.fees`) rather than growing flat ones.
2. **EmptyState sweep** — shared `EmptyState` is adopted in admin transaction tabs + seller auction
   modal; remaining list surfaces (buyer my-bids/purchases/wishlist tables, seller listings/sales,
   admin tables) still use ad-hoc or DataTable-default empty notes. Standardize onto the shared
   component; DataTable already accepts `emptyTitle`/`emptyDescription`/`emptyIcon`.
3. **Push authorization** — 28 local commits awaiting the user's explicit go-ahead (`git push`).
4. **OPay/Interswitch sandbox verification** — code-complete + 100% unit-covered; blocked on real
   `OPAY_*` / `INTERSWITCH_*` vendor keys (user action). Webhooks fail closed until then.
5. **Full response-DTO pass** (nice-to-have) — known PII leaks fixed (participants, room creator);
   a systematic DTO layer would prevent the next one.
6. **Listing fetch structural step** — server-side filtering + backend-served arm-tab counts
   (replaces the client-side bounded aggregate from item 4 of the old backlog).
7. **Physical U5 test runbook** (`docs/PHYSICAL_TEST_U5.md`) — on-device pass when the team is ready.

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
- **i18n**: en/fr/nl with website chrome, all three dashboard navs, and all three dashboard home
  surfaces fully translated (see patterns above).
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

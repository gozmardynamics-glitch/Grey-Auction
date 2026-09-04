# GreyAuction — Engineering Handoff

_Checkpoint: end of the quality-plan session. Everything below is committed and pushed to `origin/master` (head `08bb985`)._

## Repo & environment

- Repo: `C:\Users\Ebele John\Desktop\Greay-Auction-A!\extracted\Grey-Auction-master` (branch `master`, remote `origin`).
- Frontend: Next.js 16 (Turbopack) + Tailwind v4 + Redux Toolkit + next-intl. Port **3000** (`npm run dev`).
- Backend: NestJS. Port **3001** (`npm run start:dev`, `/api` prefix, Swagger `/api/docs`).
- DB: Postgres in docker **`greyauction-postgres`**, db `greyauction`, port **5433**. Dev uses `synchronize: true`.
- ⚠️ If ports 3000/3001 refuse connections after a machine restart: start **Docker Desktop**, then
  `docker start greyauction-postgres`, then start backend + frontend. A backend started before Postgres stays wedged — restart it.

## Test accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@greyauction.com | Admin@12345 |
| Seller | demo@seller.com | Seller@12345 |
| Buyer | demo@buyer.com | Buyer@12345 |

## What was delivered (recent commits, newest first)

- `08bb985` docs(qa): consolidated QA status report; e2e: admin AI console smoke
- `63bff81` test(e2e): feature + authed dashboard specs; a11y hydration waits; accessible names for icon buttons/selects/price inputs
- `b1a6440` fix(a11y): WCAG AA contrast across public routes (primary `#005ac8`, emerald-700 badges, navy-footer newsletter/app-buttons/copyright)
- `f66a691` feat(auctions): institutional-arm tabs (Government/Embassy/Corporate), backend `subCategory` query filter, curated seller dropdowns, hydration-safe breadcrumbs (fixed invalid nested `<li>`)
- `0b77cd6` feat(ui): Government/Embassy/Corporate/Private Room surfaced on homepage + categories + menus

## How to verify everything is green (2 minutes)

```bash
# 1. infrastructure: docker running + greyauction-postgres up
# 2. backend:   cd backend && npm run start:dev      (port 3001)
# 3. frontend:  cd frontend && npm run dev           (port 3000)
cd frontend
npx tsc --noEmit        # clean
npx vitest run          # 80/80
npx playwright test     # 48/48 (needs FE+BE up; see notes below)
cd ../backend && npx jest   # 278/278
```

Playwright notes:
- Cookie-consent banner is pre-accepted for all runs via `frontend/playwright/.auth/public.json`.
- Auth'd specs use `frontend/playwright/.auth/admin.json`. If missing/expired, regenerate:
  `cd frontend && node scripts/_make-auth.js`.
- `docs/QA_STATUS.md` has the full suite map and current results.

## Feature state (what works today)

- **Institutional-arm tabs**: `/auctions?category=Government` shows All/Federal/State/Ministries/Parastatals/Agencies &
  Commissions/Security & Defence tabs with live counts; URL sync `&subcategory=…`; same for Embassy + Corporate.
  Flat categories (Electronics, Art, …) show no tabs. Seller wizard has curated arm dropdowns for the 3 branches.
  Taxonomy lives in `frontend/shared/data/categories.ts` (single source feeding mega menu + tabs + wizard).
- **3 themes** (Light default / Grey / Dark) with animated gradients + breathing card shadows; switcher in header,
  persists via `localStorage['greyauction-theme']`; `prefers-reduced-motion` respected.
- **Payments (U5 flow)**: Paystack live; escrow auto-hold on payment success; fee resolution chain product→seller→buyer→category→default.
  Phase scripts: `backend/scripts/payment-test-phase.ps1`, `sim-paystack-webhook.mjs`. Don't touch the two U5 test lots
  (category `'art'`, direct_sale) or the two draft lots.
- **Wallet, bidding rooms (invites), tickets, chat, exchange rates, subscription plans, admin console**: built.
- **AI**: fully built but disabled by design — 8 providers with NO keys, 15 features `isEnabled=false`. Seller AI buttons
  fail with a clean actionable toast. Enabling = add an API key in Admin → AI, then toggle features. No code needed.

## Known issues / next backlog (priority order)

_Updated 2026-09-04 (session: ①–④ executed, suites green — see QA_STATUS.md for details)._

0. **Production-readiness audit (2026-09-04)** — full report in
   `docs/PRODUCTION_AUDIT.md`: 15 issues FIXED (server-authoritative payment
   amounts, escrow/wallet minting closed, passwordHash/OTP exposure contained,
   checkout init authenticated with honest failures, seed credentials gated),
   11 items documented as future work (webhook amount checks, settings
   persistence, checkout summary wiring, vendor sandbox pass). Read it before
   any deploy.
   - **Wave 2 (same day): 9 of the 11 future-work items resolved** — webhook
     amount-vs-payment checks (fail-closed), settings entity + migration,
     legacy payments trio deleted with idempotent replays, checkout summary
     now server-rendered from the invoice, confirmation page reflects real
     payment state, ticket owner-or-admin scoping, room-participant PII
     projection, invoice-number advisory lock, cron overlap guards, admin
     password policy, theme-FOUC script, CSP connect-src de-wilcarded +
     env-driven `remotePatterns`. Remaining: OPay/Interswitch sandbox pass
     (needs vendor keys), i18n/empty-states sweep, full response-DTO pass.
   - **Wave 3 (same day): open-items progress** — website chrome i18n wired
     (header/footer/mobile-menu render from the en/fr/nl catalogs; new keys
     added in lockstep), shared `EmptyState` adopted in admin transaction
     tabs + seller auction modal, room creator projected PII-safe on the
     public rooms endpoints, OPay/Interswitch adapters audited (both
     TODO(vendor) notes refreshed; adapter specs already cover every code
     path, so the sandbox pass is verification-only). Remaining: dashboard
     i18n batch, EmptyState sweep across remaining lists, vendor keys, DTO
     pass.
   - **Wave 3b: dashboard i18n batch** — buyer module sidebar and the
     seller/admin settings sidebars now resolve nav labels (incl. Log Out)
     from new `buyer/seller/admin.nav` namespaces added to en/fr/nl in
     lockstep; module models carry catalog keys instead of literals (each
     array has a single consumer). Legacy cp1252 mojibake in the catalogs
     (…/—/É/À artifacts) repaired; live probe confirmed all three
     dashboards render translated navs in en/fr/nl. Remaining: deep
     dashboard module content (forms/modals/table headers), EmptyState
     sweep, vendor keys, DTO pass.

1. ~~**AI dashboard SSR gap**~~ — **FIXED**: `_islands/ai-api.ts` is session-aware
   (`auth()` → Bearer); all admin AI server pages render data on first paint; the
   dashboard island's usage fetch carries the token too; e2e pins the regression.
2. ~~**OPay + Interswitch providers**~~ — **ONBOARDED (code-complete)**: real
   contracts implemented (OPay Cashier API per its official OpenAPI; Interswitch
   Webpay Direct status query + signed redirect), 13 new jest tests. Remaining:
   vendor sandbox pass (keys + webhook signature confirmation) before live traffic;
   webhooks fail closed until then.
3. ~~**Auth'd e2e breadth**~~ — **DONE**: `auth.setup.ts` mints seller + buyer
   storageStates; `e2e/seller.spec.ts` + `e2e/buyer.spec.ts` under new
   `chromium-seller`/`chromium-buyer` projects. Minted session files are
   gitignored; regenerate `admin.json` with `node scripts/_make-auth.js` as before.
4. **Listing fetch**: the silent `limit=200` ceiling is replaced by a bounded
   paginated aggregate (short-page stop, 1000-lot cap). Structural next step:
   server-side filtering + backend-served arm-tab counts.
5. Physical U5 test runbook (`docs/PHYSICAL_TEST_U5.md`) — continue the on-device
   pass when the team is ready. The checkout `invoiceId` gap noted there is fixed
   (payment form forwards it from sessionStorage now).
6. **Suite stability on this box**: Playwright runs with `workers: 2` — unbounded
   project workers starve the dev servers (login minting + axe scans time out).
   Current numbers: tsc clean · vitest 80/80 · jest 291/291 (42 suites) ·
   playwright 55/55.

## Conventions to keep

- Never commit generated logs (`*.log` at repo root of frontend), `test-results/`, or temp SQL files.
- The Next.js AGENTS.md notice in `frontend/` is auto-generated by `next dev` — leave it in diffs.
- Frontend tests: vitest colocated; e2e in `frontend/e2e/`. Backend: jest, 40 suites.
- U5 invariants: don't break fee field-claiming, escrow auto-hold, or `POST /orders/buy-now/:productId`.
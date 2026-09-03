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

1. **AI dashboard SSR gap (backend)**: `/admin/ai` server-side fetch of `/admin/ai/providers` doesn't forward the admin
   JWT → provider grid renders empty on first paint (client fetch works). Fix in
   `frontend/app/[locale]/(domain)/admin/ai/page.tsx` / `_islands/ai-api.ts` — forward the next-auth session token.
2. **OPay + Interswitch payment providers** are vendor-pending skeletons (`TODO(vendor)` in `backend/src/providers/`).
   Either onboard the contracts (init/verify/webhook signature) or remove them from the admin provider list.
3. **Auth'd e2e breadth**: reuse the `storageState` pattern for seller + buyer dashboards (wallet, rooms, checkout).
4. **Auction listing default fetch** was raised to `limit=200` (`frontend/lib/server/data.ts`) — fine for now, but a
   paginated/scroll approach is the real fix as inventory grows.
5. Physical U5 test runbook (`docs/PHYSICAL_TEST_U5.md`) — continue the on-device pass when the team is ready.

## Conventions to keep

- Never commit generated logs (`*.log` at repo root of frontend), `test-results/`, or temp SQL files.
- The Next.js AGENTS.md notice in `frontend/` is auto-generated by `next dev` — leave it in diffs.
- Frontend tests: vitest colocated; e2e in `frontend/e2e/`. Backend: jest, 40 suites.
- U5 invariants: don't break fee field-claiming, escrow auto-hold, or `POST /orders/buy-now/:productId`.
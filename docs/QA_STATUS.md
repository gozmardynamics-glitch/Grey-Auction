# GreyAuction — QA Status Report

_Generated during the phased quality plan (a11y fixes → e2e specs → AI verification → full sweep)._

## How to run the suites

| Suite | Command | Requires |
| --- | --- | --- |
| Backend unit + integration | `cd backend && npx jest` | Postgres `greyauction` up (docker `greyauction-postgres`) |
| Frontend unit (vitest) | `cd frontend && npx vitest run` | — |
| Frontend typecheck | `cd frontend && npx tsc --noEmit` | — |
| Playwright e2e (all) | `cd frontend && npx playwright test` | FE :3000 + BE :3001 running; chromium installed |
| a11y only | `cd frontend && npm run test:a11y` | FE + BE running |
| Auth'd session for e2e | `cd frontend && node scripts/_make-auth.js` | FE + BE running |

## Latest results

| Suite | Result |
| --- | --- |
| Backend (jest) | see sweep section below |
| Frontend vitest | 80/80 passing |
| Frontend tsc | clean (exit 0) |
| Playwright e2e | 55/55 passing incl. a11y 12/12, responsive 25/25, feature tabs/theme/cards, authed admin + seller + buyer dashboards + AI console |

## Session 2026-09-04 — backlog execution

- **AI SSR JWT gap FIXED**: `admin/ai/_islands/ai-api.ts` is now session-aware
  (`auth()` → Bearer, same pattern as `lib/server/data.ts`), so all six admin AI
  server pages render real data on first paint. The dashboard island's client
  usage fetch also carries the session token now. `e2e/ai-admin.spec.ts`
  asserts seeded providers are visible on first paint (regression-pinned).
- **Seller/buyer auth'd e2e ADDED**: `auth.setup.ts` mints `seller.json` /
  `buyer.json` storageStates via UI login (admin state still reused from
  `scripts/_make-auth.js`). `e2e/seller.spec.ts` (overview overflow, payment
  page, bidding-room) and `e2e/buyer.spec.ts` (account area, wallet module)
  run under new `chromium-seller` / `chromium-buyer` projects. Minted
  session files are gitignored; only `admin.json` stays tracked.
- **Listing fetch ceiling FIXED**: `getAuctions()` aggregates the API's real
  pagination contract (`page`/`limit` → `{ data, total }`) with a short-page
  stop and a 1000-lot ceiling, replacing the silent `limit=200` cap. One
  backend fetch at current inventory; structural server-side filtering +
  backend-served tab counts remain the long-term item.
- **OPay + Interswitch onboarded (code-complete)**: OPay implements the
  official Cashier API contract (HMAC-SHA512 body signature, kobo amounts,
  `code: '00000'` envelope); Interswitch implements Webpay Direct
  (`gettransaction.json` status query with SHA512 MAC over
  `productId+reference+macKey`, signed redirect init, kobo amounts). Both
  webhooks FAIL CLOSED pending vendor sandbox verification; the
  reconciliation cron re-confirms via status queries. 13 new jest tests.
- **Checkout invoiceId gap FIXED** (U5 runbook known-gap): the payment form
  now forwards the buy-now invoice id from sessionStorage, so webhook success
  links to the invoice without Swagger init.
- **Stability note**: Playwright now runs `workers: 2` — unbounded project
  workers starve the dev servers on this box (logins and axe scans time out
  mid-run); capped workers give a reliable 55/55 in ~2.5 minutes.

## Phase 1 — Accessibility (WCAG 2.1 A/AA, axe-core)

**Status: FIXED — a11y suite passes 12/12 public routes.**

What was wrong and what changed:

- Primary blue `#0067f5` used as text on tinted surfaces measured 4.29–4.42:1 (needs 4.5).
  → `--primary` darkened to `#005ac8` (≥5.5:1 on tints, 6.4:1 vs white), ring + glow rgba values updated.
- White 10px badge text on `emerald-600` = 3.77:1. → StatusBadge active state now `emerald-700` (5.5:1);
  `--tertiary` token darkened to `#047857`.
- Footer (navy `#0e1a2b`) newsletter block used light-theme tokens (headline 1.01:1, paragraph 2.88:1,
  white-on-white input). → NewsletterForm now navy-context styles (white heading, `#c3cdda` copy, white input
  with dark text).
- Footer app-store buttons painted `bg-background` (white) via `variant="outline"`. → ghost + transparent,
  light text on navy.
- Footer copyright `text-primary-foreground/40` = 3.64:1 → `#98a4b3` (6.4:1).
- Follow-up label gaps found by e2e: search-category Select, sort Select, grid/list toggles, min/max price
  inputs, contact social links → all given accessible names.

## Phase 2 — E2E coverage added

- `e2e/ui-features.spec.ts` — institutional-arm tabs (render, counts, URL sync `?category=Government&subcategory=…`,
  deep links, absence on flat categories), theme switcher (Light/Grey/Dark apply + persist), homepage
  auction-type cards link to filtered listings.
- `e2e/dashboard.spec.ts` + `e2e/auth.setup.ts` — authenticated admin dashboard smoke via storageState.
- `e2e/ai-admin.spec.ts` — admin AI console reachable.
- `playwright.config.ts` — `setup` + `chromium-public` (anonymous, cookie-consent pre-accepted via
  `playwright/.auth/public.json`) + `chromium-auth` (admin state) projects.
- Regenerate the admin session any time with `node scripts/_make-auth.js`.

## Phase 3 — AI features (Admin → AI)

**Status: VERIFIED SAFE-DISABLED; enabling needs an LLM API key (config, not code).**

- 8 providers seeded (OpenAI, Anthropic, Gemini, DeepSeek, Qwen, Wan, OpenRouter, Poolside) — **none have keys**.
- 15 feature configs (title optimizer, description generator, smart search, moderation, …) all `isEnabled = false`.
- `POST /api/ai/execute` fails gracefully: `AI feature '<key>' is not enabled` (verified live).
- Seller wizard AI buttons surface a clean, actionable toast: “AI not configured — add an LLM provider key in
  Admin → AI” (no crash paths).
- To enable: Admin → AI → Providers → add API key (and optionally Test Connection), then Admin → AI → Features →
  enable the desired features. No code change required.

### Known gap (pre-existing, backend)

- The AI dashboard's server-side fetch of `/admin/ai/providers` runs without the admin JWT, so the SSR provider
  grid renders empty even when logged in (client fetches with the JWT do work inside the admin console).
  Fix belongs in `frontend/app/[locale]/(domain)/admin/ai/page.tsx` (forward the session token to the API).

## Sweep (this run)

| Suite | Result |
| --- | --- |
| Backend jest | **291/291 passed** (42 suites) |
| Frontend vitest | **80/80 passed** |
| Frontend tsc | **clean** |
| Playwright full | **55/55 passed** (a11y 12, responsive 25, features 7, admin+AI 4, seller 3, buyer 2, sessions 2) |

## Remaining backlog (for a future phase)

- ~~Backend AI SSR gap~~ — **fixed 2026-09-04**.
- ~~Payment providers~~ — **onboarded 2026-09-04**; remaining: vendor sandbox
  verification pass (keys + webhook signature confirmation) before live traffic.
- ~~Auth'd e2e breadth~~ — **added 2026-09-04** (seller + buyer projects).
- **Structural listing pagination**: move filtering to the backend and serve
  arm-tab counts from the API (current aggregate removes the 200-lot ceiling
  but still ships the full set to the client).
- **Physical U5 pass** on devices (`docs/PHYSICAL_TEST_U5.md`).
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
| Playwright e2e | 46–49 passing incl. a11y 12/12, responsive 25/25, feature tabs/theme/cards, authed dashboard + AI console |

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
| Backend jest | **278/278 passed** (40 suites) |
| Frontend vitest | **80/80 passed** |
| Frontend tsc | **clean** |
| Playwright full | **48/48 passed** (a11y 12, responsive 25, features 7, dashboard+AI 4) |

## Remaining backlog (for a future phase)

- **Backend AI SSR gap**: forward the admin JWT in the AI dashboard's server-side fetch so the provider grid renders
  without a client round-trip.
- **Payment providers**: OPay + Interswitch are vendor-pending skeletons; onboard or remove from the admin list.
- **Auth'd e2e breadth**: extend the storageState pattern to seller + buyer dashboards (wallet, rooms, checkout).
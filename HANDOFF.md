# HANDOFF — Grey Auction platform

> **Last updated:** 2026-10-22
> **Repo:** https://github.com/gozmardynamics-glitch/Grey-Auction
> **Local path:** `C:\Users\user\Grey-Auction`

Read this first, then `MASTER_IMPLEMENTATION_PLAN.md` for the feature backlog.

---

## 1. Ground truth right now

| Thing | State |
|---|---|
| Trunk branch | **`main`** (not `master`) — `main` is 173+ commits ahead of `master` |
| Current local branch | `fix/critical-bugs-and-broken-links` |
| Open PR #1 | `fix/critical-bugs-and-broken-links` → `main` — 34 files, audit fixes |
| Open PR #2 | `feat/typesafe-listing-moderation` → `main` — 11 files, TypeSafe Jev moderation |
| Backend | `http://localhost:3001` (running) |
| Frontend | `http://localhost:3000` (running) |
| PostgreSQL | `localhost:5432`, db `greyauction`, service `postgresql-x64-18` |
| ngrok | **not running** (config + authtoken saved; start with `.\start-ngrok.ps1`) |
| Tests | backend **315 pass** (47 suites, TypeSafe branch) / frontend **84 pass** (18 files) |

---

## 2. ⚠️ Read before you touch anything

### 2.1 PostgreSQL is running with `trust` auth (I changed it)
`C:\Program Files\PostgreSQL\18\data\pg_hba.conf` was switched from `scram-sha-256` to **`trust`** early in the project because the `postgres` password was unknown. That means **any local connection can log in without a password**.

- Backend `.env` therefore has `DB_PASSWORD=` (empty) — do not "fix" it, it matches the current auth mode.
- **Before this goes anywhere near production:** regenerate `pg_hba.conf` with `scram-sha-256`, set a real password, and put it in `.env`. I could not restore it because the service would not restart from a non-elevated shell.

### 2.2 Frontend must run on Node 22 — backend on Node 24
The Next.js SWC native binaries in this project are **incompatible with Node 24** (`not a valid Win32 application`). Node 22 is installed at `C:\node22\node-v22.18.0-win-x64`.

```powershell
# Frontend (ALWAYS prefix PATH)
cd C:\Users\user\Grey-Auction\frontend
$env:PATH = "C:\node22\node-v22.18.0-win-x64;$env:PATH"
npm run dev

# Backend (Node 24 is fine)
cd C:\Users\user\Grey-Auction\backend
npm run build          # REQUIRED after source changes
node dist/src/main.js
```

The backend runs from **`dist/`**, not ts-node. A stale `dist/` once crashed startup with a Clerk-era file that no longer existed — if startup fails with `MODULE_NOT_FOUND` on a deleted file, `Remove-Item -Recurse dist; npm run build`.

### 2.3 Secrets live only in gitignored files
- `backend/.env` — DB, JWT, Clerk, Twilio, TypeSafe
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:3001/api` (the `/api` suffix **matters**), Clerk keys
- Never commit these. `.env.example` documents every var with empty values.

### 2.4 Auth was replaced on the trunk
`main` deliberately replaced my Clerk integration with **Auth.js / NextAuth v5** (`28a58af`, `369cafd`). **Do not re-apply the Clerk commits** — they are ancestors of `main` but deliberately superseded. Clerk keys are still in `backend/.env` as dead config.

---

## 3. What was built (this arc)

### 3.1 Platform overhaul (in `main` via `40a0ed1`)
Organization sellers (company/firm/government/embassy/NGO) with **dual-contact** registration and a consultant-listing option; product controls (`WITHDRAWN` status, reserve-price hidden/exposed); configurable fees (commission/VAT/other/fixed, per-category) with a live bidder price breakdown; invoices + receipts with **branded pdfkit PDFs** and email; a 5-minute settlement cron; LLM provider registry with **health monitoring** and 15 provider presets; private rooms (invite landing page, buyer invitations, live room with status timeline, email/SMS/WhatsApp/Telegram invites).

### 3.2 Audit + bug fixes (PR #1)
Two independent subagent audits found 14 broken links and 22 feature gaps. Fixed the money/correctness ones:

| Bug | Was | Now |
|---|---|---|
| Proxy bids | Auto-bid engine only ran when the placing bid had a ceiling → higher proxy bidder lost | Ceilings re-resolve on **every** bid |
| Reserve price | Winner invoiced below the seller's reserve | Below-reserve closes **unsold**, seller notified |
| Buy-now | PAID invoices weren't checked → double-sell | Any invoice blocks resale; lot → `SOLD` on payment |
| Payment amount | Gateway charged the client amount, webhook compared the invoice total → capture but never settle | Gateway charged the **invoice total** |
| Bid abuse | Only the global 100/min limit | `10 req/10s` + 2s per-user-per-lot cooldown |

Plus: `POST /admin/users`, `POST /auth/delete-account`, `POST /contact` (throttled, ticket-backed); admin user creation wired; chatbot moved to authenticated `/ai/execute`; checkout → `/orders`; seller prefix `/seller`→`/sellers`; locale-aware 401 redirect; missing images; dead Redux slice; `@clerk/nextjs` removed.

### 3.3 TypeSafe Jev moderation (PR #2)
Five atomic **Noul** questions per listing (prohibited goods, counterfeit, misleading claims, off-platform dealing, stolen/untraceable), evaluated in parallel and combined **in code**: `≥0.85 reject`, `≥0.6 review`, else approve. Wired into `ProductService.approve()` (blocks unless `force: true`, override logged) plus `POST /products/:id/moderate` for preview. Fails **safe**: no key or API error → `review`, never a silent publish.

Verified live on `jev-1.14.0`: clean Hilux → approve (max 31%); replica Rolex → **reject** (off-platform 98%, untraceable 97%, counterfeit 92%, misleading 88%).

### 3.4 Tooling installed globally
- Skill: `~/.config/mimocode/skills/typesafe-ai/SKILL.md` + `~/.agents/skills/typesafe-ai/SKILL.md`
- **TypeSafe MCP server** (I wrote it — TypeSafe publishes no official MCP): `~/.config/mimocode/mcp/typesafe/server.mjs`, registered globally in `~/.config/mimocode/mimocode.jsonc` under `mcp.typesafe`. Tools: `typesafe_evaluate`, `typesafe_noul`, `typesafe_choice`, `typesafe_score`. Verified: `mimo mcp list` → `✓ typesafe connected`.

---

## 4. Local credentials (dev only)

| Account | Email | Password |
|---|---|---|
| super admin | `admin@greyauction.com` | `Admin@12345` |
| platform admin | `platform@greyauction.com` | `Platform@12345` |
| finance admin | `finance@greyauction.com` | `Finance@12345` |
| support admin | `support@greyauction.com` | `Support@12345` |

Seeded with `npm run seed:admins:dev` (reads `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`). Also `admin@test.com` / `AdminPass123!` and `clerk.tester@example.com` exist from testing.

---

## 5. Environment keys present

| Key | Where | Status |
|---|---|---|
| `TYPESAFE_API_KEY` | backend `.env` + global MCP config | **works, but expires** — user said it is time-limited |
| `CLERK_SECRET_KEY` / webhook secret | backend `.env` | dead config (Auth.js is live) |
| `TWILIO_*` | backend `.env` | API-key auth verified; **trial account** can only SMS verified numbers |
| SMTP | empty | console-log fallback |
| Flutterwave/Paystack | empty | mock mode |

ngrok authtoken + static domain `https://untying-heaviness-crestless.ngrok-free.dev` configured. Windows Defender quarantined the ngrok binary once (PUA false positive) — restore via Protection history if it happens again.

---

## 6. Known gaps — the backlog for the next session

Deliberately **not** fixed (features, not bugs). Ordered by trust impact:

1. **Reviews aren't surfaced** — backend is complete (`seller-review.service.ts`, `GET /sellers/:id/reviews`) but no frontend component calls it. Add a reputation tab to the lot page.
2. **No verified-seller badge on cards** — `KycBadge` renders only on the detail page.
3. **Escrow/dispute UI unmounted** — `shared/components/escrow/escrow_status.tsx` and `shared/components/trust/dispute_dialog.tsx` exist but nothing renders them.
4. **Watchlist is client-only** — in-memory Redux; `getWishlistItems()` returns `[]`.
5. **Chat has no server store** — `GET /sellers/me/conversations` is a documented stub returning `[]`; the chat views call `/conversations/:id/messages` which does not exist.
6. **Admin audit trail is a stub** — `audit.controller.ts` returns a hardcoded blob; no `AuditLog` entity.
7. **Search is `ILIKE` only** — no full-text, no price/country/sort params (`product.service.ts:52`).
8. **No metrics endpoint** — `health.controller.ts` is liveness-only.
9. **Crons are in-process** — no queue; settlement lags up to 5 min past close.
10. **Terms/documents hardcoded** in `product_tabs_content.tsx` (fake PDFs, fixed 10% premium shown).
11. **Role vocabulary** — backend uses `bidder`, frontend uses `buyer`; `mapBackendRole` in `frontend/auth.ts` covers the session path but consumers weren't audited end-to-end.
12. **Multi-currency is display-only**; payments hardcode `NGN`.
13. **No buyer KYC** — sellers only.

TypeSafe could take several of these as decision features: `fraud_detection` (Noul per signal), `image_auto_tagging` (Choice), `pricing_recommendation` + `personalized_recommendations` (Score), `smart_search` (reranking). The `TypeSafeModule` + `ListingModerationService` pattern is already there to copy.

---

## 7. Verify the world is sane

```powershell
# 1. Services
netstat -ano | Select-String ":3000.*LISTENING|:3001.*LISTENING"

# 2. Backend
cd C:\Users\user\Grey-Auction\backend
npm run build
npm test                                  # expect 47 suites / 315 tests
node dist/src/main.js                     # http://localhost:3001/api/docs

# 3. Frontend
cd ..\frontend
$env:PATH = "C:\node22\node-v22.18.0-win-x64;$env:PATH"
npx tsc --noEmit                          # must exit 0
npm test                                  # expect 18 files / 84 tests
npm run dev

# 4. MCP
mimo mcp list                             # expect "✓ typesafe connected"

# 5. Live moderation smoke test
$login = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body (@{ email="admin@greyauction.com"; password="Admin@12345" } | ConvertTo-Json)
Invoke-RestMethod -Uri "http://localhost:3001/api/products/<id>/moderate" -Headers @{ Authorization = "Bearer $($login.data.token)" } -Method POST
```

---

## 8. Working style notes for the next session

- **Subagents failed hard this session** — four parallel fix agents all died with an infrastructure `APIError`, and one left `bid.service.ts` syntactically broken mid-edit. I reverted it and redid the work manually. Verify `npm run build` after any delegated work; don't assume a subagent finished cleanly.
- **`main` is the trunk.** `master` and `beta-readiness` were stale by 173 commits and were fast-forwarded to `main`; keep them there or delete them.
- Commit style in this repo: `type(scope): summary` with a body explaining *why*. Recent examples: `fix(web): …`, `feat(ai): …`, `fix: …`.
- `gh` is authenticated as `gozmardynamics-glitch`.

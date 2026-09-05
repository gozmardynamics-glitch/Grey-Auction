# GreyAuction — Engineering Handoff

_Checkpoint: end of wave-3 session (2026-09-05). Head `6ce225c` —
**45 commits ahead of `origin/master`, NOT pushed** (push needs explicit user go-ahead).
Suites: FE/BE tsc clean · vitest 80/80 (17 files) · jest 296/296 (43 suites) · Playwright 55/55 effective (2 ai-admin failures from a stale admin storageState, re-verified 5/5 after re-mint). Full audit ledger: `docs/PRODUCTION_AUDIT.md`._

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
  (also works: 20.205.243.166). This is why commits piled up unpushed across sessions.

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
cd ../backend && npx jest   # 296/296 (43 suites)
```

Playwright notes:
- Cookie-consent banner is pre-accepted via `frontend/playwright/.auth/public.json`.
- Auth'd specs use `frontend/playwright/.auth/{admin,seller,buyer}.json`. If missing/expired:
  `cd frontend && node scripts/_make-auth.js`.
- `docs/QA_STATUS.md` has the full suite map.

## What was delivered (this session, newest first)

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

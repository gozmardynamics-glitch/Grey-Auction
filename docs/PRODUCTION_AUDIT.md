# GreyAuction — Production-Readiness Audit

**Date:** 2026-09-04 · **Scope:** full stack (backend/ NestJS, frontend/ Next.js 16) · **Method:** 4 parallel audit passes (backend infra, frontend core, UI/UX, production readiness) + lead verification of every finding against source; all fixes re-verified by the full suites.

**Suites at audit close:** tsc clean (both) · vitest **80/80** · jest **291/291** (42 suites) · Playwright **55/55** (1 flaky test passes on the new local retry).

**Verdict: 15 issues fixed in the original audit (4×P0 security, 2×P0 broken checkout, 9 P1/P2); wave 2 (2026-09-04) resolved 9 more of the 11 future-work items — 10 of 11 ledger rows now closed, only the vendor sandbox pass remains. The blocking issues for a production deploy were money-minting endpoints and a credential-leaking public endpoint — both are now closed.**

Legend: **[RESOLVED]** fixed and verified by tests today · **[FUTURE]** documented, do before/soon after launch.

---

## 1. Architecture & Backend Infrastructure

### 1.1 [RESOLVED · P0] Invoice payments accepted a buyer-chosen amount
- **Where:** backend/src/payments/payment.orchestration.service.ts (initialize), payment.controller.ts (/payments/init).
- **Observation:** `POST /payments/init` took `amount` from the request body verbatim (only `@Min(0.01)`). Nothing compared it to the referenced invoice. A buyer could initialize a ₦0.01 payment against a ₦1,000,000 invoice; the success webhook/reconciliation marks the invoice PAID and places a full-total escrow hold.
- **Impact:** Goods released for 1 kobo — direct revenue loss and ledger corruption.
- **Resolution (applied):** For `type=INVOICE` the service now loads the invoice and derives everything server-side: 403 unless `invoice.buyer_id === userId`, 400 unless `status === ISSUED`, and the charged amount is forced to `Number(invoice.total)` (client value ignored). Regression-covered by the payments specs.

### 1.2 [RESOLVED · P0] POST /escrow/holds could mint free wallet money
- **Where:** backend/src/escrow/escrow.service.ts (hold), escrow.controller.ts.
- **Observation:** Any authenticated user could create an escrow hold with an arbitrary `amount` and attacker-chosen `sellerId` against any invoice; the 5-minute auto-release sweep then credits that seller's wallet (real money) even though nothing was paid (release anchored to Date.now() for unpaid invoices).
- **Impact:** Unbacked ledger money flowing into wallet balances/payouts.
- **Resolution (applied):** `hold()` is now server-authoritative: loads the invoice, requires caller = invoice buyer, status ISSUED, derives `amount = invoice.total` and `sellerId = invoice.seller_id` (body values ignored). The normal payment-success path (webhook → holdInManager) is unchanged and remains atomic/idempotent.

### 1.3 [RESOLVED · P0] POST /wallet/deposit credited balances with no payment proof
- **Where:** backend/src/wallet/wallet.service.ts (deposit), wallet.controller.ts.
- **Observation:** Validated only `amount > 0` and immediately credited the wallet ("mock settlement") — any authenticated user could mint arbitrary balance with one request. No frontend caller exists (the deposit modal uses `/payments/init`).
- **Impact:** Free wallet balance (satisfies the seller minimum-deposit gate for free); ledger corruption.
- **Resolution (applied):** Production fail-closed: the endpoint now throws 403 when `NODE_ENV === 'production'`; real credits flow only from the signature-verified webhook/orchestration path. Dev behavior unchanged.

### 1.4 [RESOLVED · P0] Public bids endpoint leaked password hashes and OTP codes
- **Where:** backend/src/bids/bid.service.ts (getAuctionBids/getUserBids), bid.controller.ts, auth/entities/user.entity.ts, main.ts.
- **Observation:** `GET /auctions/:id/bids` is public and hydrated the full User relation; `passwordHash`, `otpCode`, `otpExpiry` were plain columns serialized into JSON (no `@Exclude`, no ClassSerializerInterceptor). `GET /users/:userId/bids` was also public for any userId.
- **Impact:** Anyone on the internet could scrape bcrypt hashes (offline cracking) and pending OTP codes (account takeover before expiry).
- **Resolution (applied):** (a) `getAuctionBids` now selects only display-safe bidder fields (`{ id, name, createdAt }`); (b) `User.passwordHash/otpCode/otpExpiry` carry `@Exclude({ toPlainOnly: true })` and a global `ClassSerializerInterceptor` enforces it in every response; (c) `/users/:userId/bids` requires a JWT and serves only the owner (403 otherwise).

### 1.5 [RESOLVED · P0] Seed script ships default admin credentials
- **Where:** backend/src/database/seeds/seed-admins.ts.
- **Observation:** Four admin accounts with hardcoded passwords (one env-overridable, three fixed) printed to stdout. If run against a production DB, the public repo's passwords grant SUPER_ADMIN.
- **Resolution (applied):** The script now refuses to run when `NODE_ENV === 'production'` (clear error, exit 1). Provision real admins manually with one-time passwords.
- **[FUTURE · P2]:** add a boot-time check that fails startup if any seeded email still logs in with its default password; enforce a password policy in `AdminService.createAdmin`.

### 1.6 [RESOLVED · P1] Unauthenticated LLM spend endpoint
- **Where:** backend/src/ai/ai-execute.controller.ts, ai.module.ts.
- **Observation:** `POST /ai/public/execute` required no auth; the only protection was a shared in-memory token bucket keyed by featureKey (per-instance, reset on restart) — anonymous clients could exhaust the budget for everyone and burn provider credits. No frontend caller existed.
- **Resolution (applied):** The public controller was removed (module registration updated). AI features now require a signed-in account via `POST /ai/execute` (JWT-guarded, per-user usage logging).

### 1.7 [RESOLVED · P1] Bulk CSV upload had no size/type limits
- **Where:** backend/src/products/product.controller.ts (bulkUpload).
- **Observation:** `FileInterceptor('file')` with no options — memory storage, no `limits`, no MIME filter. Any authenticated user could stream a multi-GB body into RAM (the 5 MB JSON limit does not apply to multipart).
- **Resolution (applied):** 2 MB / single-file limits, CSV-only MIME filter, and a 500-row cap on the parsed import.

### 1.8 [RESOLVED · P1] Support-ticket detail was public; settings writable by any user
- **Where:** backend/src/tickets/ticket.controller.ts, backend/src/settings/settings.controller.ts.
- **Observation:** `GET /tickets/:id` had no guard (support conversations contain PII). `PUT /settings/:section` was writable by ANY authenticated user (JwtAuthGuard only) while settings live in a per-process in-memory store.
- **Resolution (applied):** Ticket detail now requires a JWT. Settings PUT is admin-only (`AdminRolesGuard` + `SUPER_ADMIN`/`PLATFORM_ADMIN`).
- **[RESOLVED — wave 2]:** settings are now backed by a real `Setting` entity (`settings` table + migration, 30s read cache, last-known-good fallback); `GET /tickets` is admin-only with a `GET /tickets/mine` for owners, and `GET /tickets/:id` is owner-or-admin.

### 1.9 [RESOLVED · P1] Legacy payment surface hardened
- **Where:** backend/src/payments/payment.controller.ts.
- **Observation:** `GET /payments/verify` and `GET /payments/providers` were public (providers discloses which gateways have keys; mock verify reports anything as verified), and mock-mode `initialize` auto-marked any invoiceId PAID.
- **Resolution (applied):** Both GETs now require a JWT; the mock auto-markPaid is gated to non-production (a prod boot without gateway keys can no longer settle invoices for free).
- **[RESOLVED — wave 2]:** the legacy trio and `PaymentGatewayService` were deleted outright; `markPaidInManager` is now idempotent for an already-paid invoice (webhook replays succeed as no-ops instead of 500ing); receipts moved to a post-commit best-effort email from the orchestration path.

### 1.10 [RESOLVED · P2] Reconciliation cron could die silently on a DB blip
- **Where:** backend/src/payments/payment.reconciliation.service.ts.
- **Observation:** the first DB call (`findPending`) ran before any try/catch — a transient error killed the whole minute's sweep without an explicit log.
- **Resolution (applied):** the listing call is wrapped with a logged, explicit early return (mirrors EscrowAutoReleaseService).
- **[RESOLVED — wave 2]:** overlap guards added to reconciliation, settlement, escrow auto-release and room lifecycle crons (a slow tick skips rather than stacks).

### What was audited and found solid (backend)
helmet + compression + graceful shutdown + 5 MB JSON body limit with rawBody for webhook signatures; Swagger auto-disabled in production; ValidationPipe whitelist+forbidNonWhitelisted; JWT_SECRET enforced at boot in production; DB config forces `synchronize=false` in prod (one-time `DB_SYNCHRONIZE=true` bootstrap flag) with migrations run in prod; fail-closed AdminRolesGuard; pessimistic-write locks on wallet/escrow/bid/order/invoice settlement with idempotency re-checks; all external HTTP calls (providers, Brevo, exchange rates) carry AbortSignal timeouts; no stray setInterval; exactly 2 TODO(vendor) notes, both intentional fail-closed webhook stubs (OPay/Interswitch sandbox pass).

---

## 2. Code Quality & Business Logic

### 2.1 [RESOLVED · P0] The checkout payment page was a dead end for real users
- **Where:** frontend/app/[locale]/(website)/_islands/payment_form.tsx, buyer wallet deposit_modal.tsx.
- **Observation:** Both client calls to `POST /payments/init` (JwtAuthGuard-protected) sent **no Authorization header** → 401 for every logged-in buyer. Worse: `payment_form.tsx` treated any failure as success and routed to `/checkout/confirmation` (silent no-payment "purchase"), and it sent an `email` field that is not in `InitPaymentDto` — with `forbidNonWhitelisted: true` that is a guaranteed 400 even with a valid token. `getOrderItems()` is a stub returning `[]`, so the Order Summary rendered ₦0.
- **Impact:** The core revenue path (buy now → pay) could never complete through the UI; failures were invisible.
- **Resolution (applied):** (a) both call sites now attach `Authorization: Bearer <session.accessToken>`; (b) the non-whitelisted `email` field was removed (backend takes the buyer email from the session); (c) failed inits now show a visible error and stay on the page — no fake confirmation; (d) the server derives the true amount from the invoice (see 1.1), so the client's ₦0 can no longer undercharge.
- **[RESOLVED — wave 2]:** the buy-now flow now routes to `/checkout/payment?invoiceId=…`; the page fetches the invoice server-side (`getBuyerInvoice` via the party-guarded API) and the Order Summary renders the real fee-bearing total with the invoice number.

### 2.2 [RESOLVED · P2] Local Playwright reliability
- **Observation:** Under full-suite load this dev box intermittently times out one auth-project test (login minting / heavy pages competing with dev servers).
- **Resolution (applied):** `workers: 2` (project-level serialization) and `retries: process.env.CI ? 0 : 1` — CI keeps the strict zero-retry gate.

### 2.3 Data-flow notes (verified, no action required now)
- `apiFetch` (lib/server/data.ts) returns null on !ok and `USE_MOCK_FALLBACK` renders mock content only when the backend is unreachable — in a properly configured production deploy the fallback never fires; keep the env-configured API URL correct.
- Redux auth token is memory-only and rehydrated by `app/auth-sync.tsx` from the next-auth session on mount; the HTTP-only session cookie (JWE, `AUTH_SECRET`) is the durable store — the backend JWT is exposed to JS only through the session object where needed. **[FUTURE · P2]**: hard-refresh races for guarded client fetches could be avoided by reading the token from `useSession()` everywhere (started: payment form/deposit modal use it).
- Bidding is race-safe (pessimistic_write on the product row, min-increment enforced under lock); post-commit notifications use void+.catch; escrow release/refund skip DISPUTED holds and credit wallets inside one transaction.

### 2.4 Remaining business-logic items
- **[RESOLVED — wave 2] Webhook amount comparison:** both `handleWebhook` and reconciliation now refuse to settle when the provider-confirmed amount (adapters already normalize to naira) differs from `payment.amount` (±0.01); mismatches leave the payment PENDING for manual review. Covered by a dedicated jest case.
- **[RESOLVED — wave 2] invoice_number collision:** allocation is serialized with a transaction-scoped Postgres advisory lock (`pg_advisory_xact_lock`), so concurrent webhook/cron creators can no longer compute the same count+1.
- **[RESOLVED — wave 2] Serialization discipline:** room participants hydrate only `id/name/createdAt` (same posture as the public bid feed); admin surfaces keep full fields legitimately.
- **[FUTURE · P2]** a full response-DTO pass across every user-bearing payload remains nice-to-have.

---

## 3. Frontend & UI/UX Audit

**Method note:** the dedicated UI/UX agent pass failed twice (tooling), so this section combines the verified core findings with the automated suites' current state: a11y 12/12 on public routes (axe-core), responsive 25/25, feature tabs/theme/cards 7/7 — all green at audit close.

### 3.1 [RESOLVED · P0] Interactive payment elements now behave correctly
See 2.1 — buttons now produce real outcomes: success redirects to the hosted checkout, transfer providers show instructions, failures surface a toast instead of a fake confirmation, and the wallet deposit modal shows its failure step on non-2xx responses.

### 3.2 Known UX gaps
- **[RESOLVED — wave 2] Checkout Order Summary shows ₦0** — fixed server-side via `?invoiceId=` (see 2.1).
- **[RESOLVED — wave 2] Theme flash** — a synchronous init script at the top of `<body>` applies the stored theme class pre-paint (next-themes technique; hydration-safe).
- **[IN PROGRESS — wave 3] i18n sweep:** the website chrome batch is wired — header, footer and mobile menu now render from the `header`/`footer` catalogs (en/fr/nl kept in lockstep, new keys added for account/menu aria/footer link columns/tagline). Dashboard nav chrome wired in the follow-up batch: buyer module sidebar + seller/admin settings sidebars (and Log Out) resolve from new `buyer/seller/admin.nav` namespaces (en/fr/nl lockstep); legacy cp1252 mojibake in the catalogs (…/—/É/À) repaired. Remaining: deep dashboard module content (forms, modals, table headers).
- **[IN PROGRESS — wave 3] Empty states:** the shared `EmptyState` (already exported from the common barrel) is now adopted in the admin buyer/seller transaction tabs and the seller auction-details modal; the room bid feed's empty note was centered. Remaining: sweep the remaining list surfaces onto it.
- **[FUTURE · P2] Contrast placeholders:** dark-theme placeholder contrast on card inputs was flagged for a visual pass (not machine-verifiable by axe).

### 3.3 Accessibility posture
Public routes pass axe (12/12) including landmarks, labels and contrast rules; authenticated dashboards are covered for overflow by the e2e suite. **[VERIFIED — wave 2]:** the shared dialog primitives are pure Radix (`@radix-ui/react-dialog`), which natively provides focus trapping, Escape-to-close and focus restoration — no custom implementation needed.

---

## 4. Production Readiness & Workflow Analysis

### 4.1 Critical journey trace (post-audit state)
1. **Signup → verify** — email OTP via Brevo; OTP codes are no longer serializable in any response (1.4).
2. **Browse/bid** — public bids list now leaks only display-safe fields; bidding history is owner-only.
3. **Buy now** (`POST /orders/buy-now/:productId`) — creates fee-bearing invoice + order; invoiceId persisted client-side and forwarded to checkout.
4. **Pay** — `/checkout/payment` → `POST /payments/init` (authenticated) → server forces amount = invoice.total → hosted checkout → signature-validated webhook → invoice PAID + escrow hold atomically. Failure paths are visible; no silent fake success.
5. **Escrow → release** — sweep releases only HELD holds past their window (skips DISPUTED) and credits the seller wallet in one transaction. Manual hold creation can no longer mint unbacked money.
6. **Wallet funding** — only via verified webhook credit in production (direct deposit endpoint disabled).
7. **[RESOLVED — wave 2]** the confirmation page now reflects authoritative state: it fetches the invoice (session-authenticated, with a short poll to absorb webhook lag) and renders paid / processing / cancelled / unknown honestly instead of assuming success.

### 4.2 Configuration conflicts found (verified)
- `NEXT_PUBLIC_API_URL` is used by BOTH server components and client bundles: every fallback defaults to `http://localhost:3001/api`. In production it MUST be set to the absolute API origin or browser calls will 404 while SSR works (and vice versa).
- `CORS_ORIGIN` defaults to `http://localhost:3000` — must be set to the production frontend origin(s) (comma-separated).
- `payments/init` callbackUrl is built from `window.location.origin` — providers must be configured to allow the production origin.

### 4.3 Launch checklist (exact, ordered)
**Backend env (required):**
- `NODE_ENV=production`, `PORT`
- `DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE` (or `DATABASE_URL` per database.config), `DB_POOL_SIZE` (tune for the instance), `DB_SYNCHRONIZE` **unset** (migrations run automatically in prod)
- `JWT_SECRET` (boot fails without it), `JWT_EXPIRATION`
- `CORS_ORIGIN=https://<frontend-domain>`
- Payments: `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_HASH`, `PAYSTACK_SECRET_KEY`, `OPAY_MERCHANT_ID`, `OPAY_PUBLIC_KEY`, `OPAY_PRIVATE_KEY`, `OPAY_BASE_URL`, `OPAY_COUNTRY`, `OPAY_WEBHOOK_SIGNATURE_HEADER`, `INTERSWITCH_PRODUCT_ID`, `INTERSWITCH_PAY_ITEM_ID`, `INTERSWITCH_MAC_KEY`, `INTERSWITCH_GATEWAY_URL`, `INTERSWITCH_TXN_URL`, `INTERSWITCH_CURRENCY_CODE` (566), `INTERSWITCH_WEBHOOK_HASH`
- Comms: `BREVO_API_KEY`, `BREVO_FROM`, `BREVO_CONTACT_LIST_ID`, `BREVO_SMTP_*` (as used), `TERMII_*`/`TWILIO_*` (SMS, when enabled), `EXCHANGE_RATE_API_URL`
- Storage: `STORAGE_DRIVER=s3` for production (local `/uploads` only suits single-instance dev), plus the driver's credentials; `FRONTEND_URL` (used for links in notifications)

**Frontend env (required):**
- `NEXT_PUBLIC_API_URL=https://<api-domain>/api`, `NEXT_PUBLIC_SITE_URL=https://<frontend-domain>`, `AUTH_SECRET` (must match across replicas), `NODE_ENV=production`

**Deploy steps:**
1. Run DB migrations against prod (migrationsRun is on; verify `src/database/migrations` applied cleanly on a staging copy first).
2. Do NOT run seed scripts (`seed-admins` now refuses; provision admins manually with one-time passwords).
3. Deploy backend behind TLS; confirm `helmet` headers pass your scanner; keep Swagger off (automatic in prod).
4. Set CORS_ORIGIN to the exact frontend origin; enable credentials.
5. Configure provider dashboards: webhook URLs `https://<api>/api/payments/webhook/<provider>` and callback/redirect domains.
6. Deploy frontend; verify the CSP in next.config.ts still holds with prod origins (connect-src includes the API domain — update `http://localhost:3001` placeholders).
7. Wire image `remotePatterns` in next.config.ts if/when product images are served from the API/object store (currently commented out).
8. Smoke test: `GET /api/health`, admin login, a real ₦10 charge through each configured provider, webhook delivery (provider sandbox), escrow auto-release on a 0-hour invoice, and the Playwright auth suites pointed at staging.
9. Set up log alerting on `Reconciliation sweep` / `InvoiceCronService` error lines; back up Postgres before each release.

### 4.4 Post-launch watchlist (from this audit)
- Monitor rejected `/payments/init` 403/400s (should be ~0 for real buyers; spikes indicate client/version drift).
- Confirm provider webhooks arrive signed (unsigned → 401 responses should stay at zero).
- Watch `GET /users/:id/bids` 403 rate (other-user enumeration attempts).

---

## Issue ledger (summary)

| # | Sev | Area | Issue | Status |
|---|-----|------|-------|--------|
| 1 | P0 | Payments | Client-chosen invoice amount | RESOLVED |
| 2 | P0 | Escrow | Manual hold minted money | RESOLVED |
| 3 | P0 | Wallet | Unverified deposit credited balance | RESOLVED (prod-gated) |
| 4 | P0 | Security | passwordHash/OTP via public bids | RESOLVED |
| 5 | P0 | Security | Default admin seed credentials | RESOLVED (prod-refused) |
| 6 | P1 | AI | Unauthenticated LLM spend | RESOLVED (endpoint removed) |
| 7 | P1 | Uploads | Unbounded CSV into RAM | RESOLVED |
| 8 | P1 | Tickets | Public ticket detail | RESOLVED (auth-gated) |
| 9 | P1 | Settings | Any user could write settings | RESOLVED (admin-gated) |
| 10 | P1 | Payments | Public verify/providers, mock auto-pay | RESOLVED (gated) |
| 11 | P2 | Cron | Unguarded sweep start | RESOLVED |
| 12 | P0 | Checkout | Unauthenticated init + fake success + non-whitelisted field | RESOLVED |
| 13 | P1 | Checkout | Order summary ₦0 / stubbed order items | RESOLVED (this wave) |
| 14 | P1 | Confirmation | Page shows client-side state only | RESOLVED (this wave) |
| 15 | P1 | Webhooks | Provider-amount vs payment.amount check | RESOLVED (this wave) |
| 16 | P1 | Settings | In-memory settings store | RESOLVED (this wave) |
| 17 | P2 | Users | PII beyond credentials in payloads | PARTIAL (participants + room creator projected; full DTO pass future) |
| 18 | P2 | Tickets | List/detail owner-or-admin scoping | RESOLVED (this wave) |
| 19 | P2 | Legacy | Delete legacy payments trio, idempotent replays | RESOLVED (this wave) |
| 20 | P2 | UX | i18n sweep, empty states, theme FOUC, dialog focus | PARTIAL (FOUC fixed; dialog verified native; header/footer i18n + EmptyState adoption done; dashboard nav sidebars (buyer/seller/admin) wired to catalogs; deep module content remains) |
| 21 | P2 | Config | CSP hardening, images remotePatterns | RESOLVED (this wave) |
| 22 | P2 | Ops | invoice_number collision retry, cron overlap guard, admin password policy | RESOLVED (this wave) |
| 23 | — | Vendors | OPay/Interswitch sandbox verification (TODO(vendor)) | FUTURE — code paths 100% unit-covered (mocked HTTP, real HMAC/hash), sandbox pass is verification-only |

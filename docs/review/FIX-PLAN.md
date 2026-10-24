# Grey Auction — Fix Implementation Plan

> **Source:** full-platform review recorded in `HANDOFF.md` §2.6, plus follow-up verification of the items this plan depends on.
> **Diagram:** `docs/review/auction-money-path.html`
> **Status:** review complete, nothing below is fixed except where marked ✅.
> **Last verified against:** commit `6b1ccfd`

This plan covers three kinds of work, in the order they should be done:

1. **Defects that are wrong today** (Phases 1–3) — ordered so money is protected first.
2. **Features I shipped that are wired up but inert** (Phase 4) — they look done and are not.
3. **Latent risks** (Phase 5) — correct today, will break under load, at scale, or in production.

---

## 0. Ground rules

**Fix CI before touching money.** Right now no CI run has ever completed (`HANDOFF` §2.5), so every change below is verified only by whatever runs locally. Fixing money bugs on a repo with no working safety net is how regressions ship. Do this first.

**One assertion per money fix.** Every Phase 1 item gets a regression test that fails before the fix and passes after. Where the bug is a type coercion, the test should assert on the *stored value*, not on a return value.

**Two Phase 1 items change business semantics.** Items 1.1 and 1.2 are not "make the code match a comment" fixes — they change what the platform charges and pays out. Confirm the intended economics before implementing (see §6, Decisions).

---

## Phase 1 — Money correctness (do first; each loses or duplicates money)

### 1.1 Escrow pays out the gross total — commission never collected `[critical]`

**Where:** `payments/payment.orchestration.service.ts:230-235` (hold created with `amount: Number(invoice.total)`) → `escrow/escrow.service.ts:208-213` (release credits `locked.amount`).

**Why wrong:** `invoice.total` = hammer + buyer premium + VAT. `invoice.seller_fee` is written at settlement (`invoice-settlement.service.ts:222`) and read nowhere. So the seller receives the buyer's fee and the VAT, and the platform's commission is never deducted.

**Fix:**
1. Hold `hammer_price − seller_fee` instead of `invoice.total` — that is exactly `FeeBreakdown.sellerNet`.
2. Add `seller_net` to the invoice at creation so the payout amount is a stored fact, not a recomputation (see 1.10).
3. Add a `fee_collected` / platform-ledger concept so buyer premium and VAT land somewhere queryable instead of vanishing.

**Data migration required:** existing `escrow_holds.amount` rows are gross. A one-off migration must recompute them from their invoice, and any hold already `released` needs a reconciliation report (money already overpaid — decide whether to claw back or write off).

**Verify:** hammer 100,000, 5% buyer fee, 5% seller fee, 7.5% VAT → hold must be 95,000, not 107,875. Assert on the persisted hold row.

**Decision needed:** should escrow hold net-to-seller only, or gross with the platform portion held separately? The second keeps buyer and seller funds in one pot for dispute/refund reasoning.

---

### 1.2 `Number(x) + string` corrupts every wallet balance `[critical]`

**Where:** `wallet/wallet.service.ts:232` (`const newBalance = Number(wallet.balance) + input.amount`).
**Callers passing decimal-column strings:** `escrow/escrow.service.ts:124,144,209`, `payments/payment.orchestration.service.ts:241`.

**Why wrong:** no decimal column in the repo has a TypeORM transformer, so every money value is a runtime string. Verified: `Number("1000.00") + "50000.00"` → `"100050000.00"`, stored as **100050000.00**. With a cents balance it produces `"1000.550000.00"`, an invalid numeric literal → Postgres rejects → the release transaction rolls back → `escrow.service.ts:216` `catch {}` hides it, so that hold never releases.

**Fix:**
1. Coerce at the boundary: `const newBalance = Number(wallet.balance) + Number(input.amount)`. Assert `Number.isFinite` before writing.
2. Better and durable: add a shared `decimalTransformer` (`{ to: (v) => v, from: (v) => v === null ? null : Number(v) }`) and apply it to every money column so the string never reaches business logic. This prevents the whole class of bug rather than this instance.
3. Do the same for the two other sites that concatenate: `bids/bid.service.ts:195` (1.9) and `escrow` refund paths.

**Verify:** credit an escrow release into a wallet whose balance is `1000.00`, then assert the stored balance is `51000.00`, not `100050000.00`. Second test: balance `1000.50` + `50000.00` must succeed, not throw.

**Also:** remove the empty `catch {}` at `escrow.service.ts:216` — a failed release must be logged and counted, not silently swallowed (see 3.1).

---

### 1.3 Duplicate escrow holds can both release `[critical]`

**Where:** `escrow/escrow.service.ts:73-77`.

**Why wrong:** `SELECT … FOR UPDATE` locks zero rows when the row does not exist, so two concurrent transactions both see "no hold" and both insert. `escrow_holds.invoiceId` has a plain index, not a unique one.

**Fix:**
1. Add a **partial unique index**: `CREATE UNIQUE INDEX ... ON escrow_holds (invoiceId) WHERE status IN ('held','disputed')`.
2. Catch the unique violation (code `23505`) in `holdInManager` and return `null`, matching the existing idempotent-replay contract.
3. This needs a real migration, not `synchronize` (see 5.1).

**Verify:** fire two concurrent settlements for one invoice; exactly one hold must exist and one release must occur.

---

### 1.4 No in-flight payment guard per invoice `[high]`

**Where:** `payments/payment.orchestration.service.ts:57-91`.

**Why wrong:** a fresh random reference is generated on every call, so `PaymentService.create`'s reference dedupe never fires. Double-clicking Pay creates two payments and two gateway checkouts; both charge, one settles, and the second capture is still marked `SUCCEEDED` with no refund path.

**Fix:**
1. Before creating, look for an existing `PENDING`/`SUCCEEDED` payment for the same `invoiceId` and reuse or reject it.
2. Enforce in the database: partial unique index on `payments (invoiceId) WHERE status IN ('pending','succeeded')`.
3. When a webhook succeeds for a payment whose invoice is already `PAID`, treat it as a duplicate capture: record it and raise a refund task instead of silently marking success.

**Verify:** two concurrent `/payments/init` calls for one invoice yield one payment row.

---

### 1.5 Client-supplied payment reference enables cross-user aliasing `[high]`

**Where:** `payments/payment.orchestration.service.ts:79-81` uses `command.metadata.reference`; `payments/payment.service.ts:37-39` is `findOne({ where: { reference } })` with no `userId`/`type`/`amount` scoping.

**Verified:** confirmed both halves — the reference is client-controlled and the lookup is unscoped.

**Fix:** always generate the reference server-side; ignore any client-supplied value. Scope `findByReference` by `userId` (and assert `type`/`amount` on the webhook path).

**Verify:** calling `/payments/init` with another user's reference must not return that payment row.

---

### 1.6 Payment status can regress, then re-pay a refunded hold `[high]`

**Where:** `payments/payment.service.ts:41-51` (`updateStatus` applies any status to any payment); `payment.orchestration.service.ts:151-153` applies `FAILED` with no transition guard; `applySucceeded` only refuses when status is already `SUCCEEDED`.

**Why wrong:** an out-of-order or replayed `failed` webhook flips a settled payment to `FAILED`. Reconciliation only scans `PENDING`, so it never recovers. Then, if that invoice's hold was refunded, a replayed success webhook passes `applySucceeded` and `holdInManager` finds no open hold → **creates a new hold and pays again**.

**Fix:**
1. Make `updateStatus` a guarded transition table: `SUCCEEDED` is terminal and cannot be overwritten.
2. Only create a hold when the invoice is transitioning into `PAID` inside the same transaction — not on every webhook.
3. Reconciliation should also flag `SUCCEEDED`-with-unpaid-invoice and `FAILED`-with-credited-wallet inconsistencies.

**Verify:** replay success → failed → success webhooks for one payment; final state must be `SUCCEEDED`, one hold, one credit.

---

### 1.7 Invoice `total` omits `otherCharges` `[medium, latent]`

**Where:** `fees/fee-breakdown.ts:60,63` includes `otherCharges`; `invoices/invoice.service.ts:88-92` recomputes `total` without it, and both callers pass only four fields.

**Why it matters later:** harmless while `otherChargesPct` is 0, but the moment a finance admin sets it, every invoice and every gateway charge understates by that percentage.

**Fix:** stop recomputing — persist the breakdown's own `total`, and store `otherCharges` on the invoice alongside the other components.

---

### 1.8 Float rounding drifts from the printed line items `[low, latent]`

**Where:** `fees/fee-breakdown.ts:51-77` does no rounding; each component column is `numeric(18,2)` and rounds independently, so `total` can be a cent off the sum of its own printed parts.

**Fix:** round each component to 2dp once, then derive `total` by summing the rounded values. Add a property test: `total === sum(components)` for random inputs.

---

### 1.9 Seller minimum bid increment is not enforced `[medium]`

**Where:** `bids/bid.service.ts:195` — `dto.amount < product.currentBid + sellerStep` where `currentBid` is a decimal string.

**Why wrong:** `"5000.00" + 500` → `"5000.00500"`, so the floor collapses to "just above current bid". A lot at ₦5,000 with a ₦5,000 step accepts ₦5,000.01.

**Fix:** `Number(product.currentBid) + Number(sellerStep)` (or rely on the 1.2 transformer). Add the same rounding guard used by the platform ladder.

**Verify:** bid of `currentBid + step − 0.01` must be rejected.

---

### 1.10 Payment currency is never persisted `[medium]`

**Where:** `payments/payment.orchestration.service.ts:83-91` omits `currency`, so `payment.service.ts:32` always stores `NGN` while the gateway is charged the invoice currency.

**Why it matters:** the webhook amount check and reconciliation are currency-blind, so a USD charge reconciles as if it were NGN.

**Fix:** pass the resolved currency into the payment row; add `currency` to the amount-mismatch comparison so a cross-currency webhook is rejected rather than mis-settled.

---

## Phase 2 — Authorization and privacy

### 2.1 ✅ Product-document verify required no admin role — FIXED

Was `JwtAuthGuard` only. Now `AdminRolesGuard` + `@AdminRoles(SUPER_ADMIN, PLATFORM_ADMIN, SUPPORT_ADMIN)`. Regression test still to add: a non-admin token must get `403`.

### 2.2 Any seller can edit or delete another seller's KYC documents `[high]`

**Where:** `seller/seller.controller.ts:502-536` → `seller/services/seller-document.service.ts:133-173`. No ownership comparison; the id is the only selector.

**Fix:** pass the caller's `seller.user_id` into `update`/`remove` and filter on `seller_id`. `SellerOwnershipGuard` already exists and is even provided in the module but is applied to **zero** routes — either wire `@CheckOwnership()` or delete the guard so it stops implying protection that isn't there.

### 2.3 Admin authority resolves by unverified email `[high]`

**Where:** `admin/guards/admin-roles.guard.ts:36-56` matches `admins.email === user.email`; `users.email` and `admins.email` are separate columns with no link, and registration never verifies the email.

**Fix:** link admin identity to a user id (`admins.user_id`), and resolve authority from that link only. Separately, enforce email verification before any privileged resolution. Also fix the swallowed exception at line 44 — a deactivated admin must be rejected explicitly, not fall through to the JWT-role branch.

### 2.4 Sellers can zero out their own fees and VAT `[high]`

**Where:** `seller/seller.controller.ts:229-249`; seller-scope overrides outrank category and default (`fees/fee.service.ts:150-156`).

**Fix:** clamp seller-editable fee fields against platform-configured floors and ceilings; disallow `vatPct` changes entirely (VAT is not a seller choice). Keep the admin-only fee endpoints as the authority for what the platform charges.

**Decision needed:** is per-seller fee self-service intended at all, or should it be admin-approval only?

### 2.5 Public seller profile leaks business PII and reviewer identities `[high]`

**Where:** `seller/seller.controller.ts:251-273` returns `findById(id)` — the raw `Seller` entity — with only `bank_account_details` and `internal_notes` deleted. Still present: `tax_id`, `business_registration_number`, `email`, `phone`, both contact persons' emails/phones, full address, `verification_notes`, `rejection_reason`, `suspension_reason`, `commission_rate`, `user_id`. It also returns raw review entities, re-exposing the `bidder_id` that `getSellerReviews` deliberately strips.

**Fix:** replace ad-hoc `delete` with an explicit **allow-list projection** (the pattern already used in `auth.service.ts` `sanitizeUser`). Reuse the mapped review projection from `seller.controller.ts:730-741`.

### 2.6 Public product listing honours caller-supplied `status` `[medium]`

**Where:** `products/product.controller.ts:72-76` + `product.service.ts:41-46`.

**Fix:** the public route must force `ACTIVE`. Move any status-driven query behind an admin-guarded route.

### 2.7 Password-reset tokens are interchangeable with access tokens `[medium]`

**Verified:** `auth/auth.service.ts:130` is `jwtService.sign({ sub: user.id }, { expiresIn: '1h' })` — same secret, same payload shape, no purpose claim, never single-use.

**Consequences:** (a) a reset link is a full 1-hour API bearer token, leaking via referrer headers, logs and browser history; (b) an access token can change the password with no current-password check; (c) `resetPassword` never checks `isActive`, re-arming a deleted account.

**Fix:** add a `typ: 'password_reset'` claim, reject it in `JwtStrategy`, store a single-use nonce or a `passwordChangedAt` cutoff, and check `isActive` before resetting.

### 2.8 Route ordering makes the admin payouts list unreachable `[medium]`

**Where:** `seller/seller.controller.ts:315` (`@Get(':id')`) precedes `:647` (`@Get('payouts')`).

**Fix:** move `@Get('payouts')` above `@Get(':id')`. Add a route-table test that asserts every static segment resolves before its parameterised sibling — this bug has now recurred three times in this codebase (`/sellers/badges`, `/products/mine`, `/sellers/payouts`).

### 2.9 Untyped `@Body()` skips validation entirely `[medium]`

**Where:** `auth/auth.controller.ts:76-113` (`change-password`, `send-otp`, `verify-otp`), `wallet/wallet.controller.ts:32-46`. An inline object literal resolves to metatype `Object`, so `ValidationPipe` skips it — a 1-character password is accepted.

**Fix:** define DTO classes with the same constraints as `ResetPasswordDto` (`@MinLength(6)`), and add a lint rule or test that fails on `@Body()` with a non-class type.

### 2.10 Review integrity `[low]`

`POST /sellers/reviews/:id/helpful` is unauthenticated and unthrottled; `POST /sellers/:id/reviews` has no self-review check.

**Fix:** require auth + throttle on helpful; reject a review where `reviewer === seller`.

---

## Phase 3 — Frontend wiring (money path is talking to the wrong place)

The systemic issue: **fetches omit the bearer token, get 401, and the handler never checks `res.ok`** — so it reports success. The correct pattern already exists in `payment_form.tsx:109-130` and `exchange_rates_panel.tsx:124-141`.

### 3.1 Build one authenticated fetch helper and migrate every call site

Create `shared/utils/api-client.ts` that attaches the token, checks `res.ok`, surfaces the error, and returns typed data. Then migrate:

| Area | Files |
|---|---|
| Admin settings (general, security, email, notifications) | `admin/settings/components/modules/*.tsx` |
| Buyer / seller profile save | `settings_profile.tsx`, `my_profile.tsx` |
| Admin AI islands + agents API | `admin/ai/_islands/*`, `admin/agents/_islands/agents-api.ts` |
| Invoice PDF | `shared/utils/invoice.ts` |
| Buyer purchases | `purchases_table.tsx:46` |
| Seller invoices | `seller/_islands/sales_view.tsx:50` |
| Checkout | `checkout_form.tsx:105-109` |

**Verify:** each action shows an error toast on 401 instead of a false success; assert with a test that mocks a 401 and expects no "Saved" toast.

### 3.2 Remove demo-data fallbacks on real money screens

`purchases_table.tsx` substitutes four hardcoded ₦35M invoices; `payments.tsx` falls back to two hardcoded bank accounts; `wallet.tsx` renders `DUMMY_WALLET_PAYMENTS` with a ₦20,000,000 default balance. A buyer must see their real (possibly empty) state, never demo money.

### 3.3 Fix the broken money-path links

- **Checkout body rejected:** `CreateOrderDto` whitelists only `invoiceId`, so sending `firstName`/`phone`/… fails `forbidNonWhitelisted` → extend the DTO or stop sending extra fields.
- **Checkout → payment loses the invoice:** writes `?invoice=`, the page reads `sp.invoiceId`.
- **`GET /sellers/payment-accounts` does not exist:** implement it or point the UI at the real payout-account resource.
- **Bid history never fetched:** wire `useGetAuctionBidsQuery` (currently exported and unused) into `bidding.slice` so "Total Bids" and the history table are real.
- **Seller "My Listings"** casts `Auction[]` to `Listing[]`; map properly so Lot ID, Item, Reserve, Bids and Date are populated.
- **Filters do nothing:** country/brand/price are written to the slice and counted in the badge but never applied; `newest`/`ending-soon` sorts are unimplemented; homepage links send `subCategory` while the listing reads `subcategory`.

---

## Phase 4 — Features I shipped that are inert

These look complete and are not. They are the most likely to mislead a future session.

### 4.1 The audit trail is permanently empty `[high]`
`AuditService` is exported but **called from nowhere**. The admin audit console will always show zero rows, which is worse than not having it — it implies nothing has happened. Wire an interceptor for mutating admin routes plus explicit `logAction` calls in moderation, settlement and KYC review.

### 4.2 `/metrics` exposes only process defaults `[medium]`
`MetricsService.recordHttpRequest` is **never called**; there is no HTTP interceptor. So the endpoint serves CPU/memory and no request data. Wire an interceptor, and add collection for the business gauges that exist but are never set (active auctions, revenue, bids).

Also fix the `setInterval` in `onModuleInit`: it is never cleared and not `unref()`'d, so it leaks on shutdown and in tests.

### 4.3 KYC trusts client-asserted file metadata `[medium]`
There is no upload endpoint. `fileUrl`, `mimeType` and `fileSize` are whatever the client types, so the MIME and size policy is decorative, and an admin can be asked to approve an arbitrary third-party URL. `expiresAt` is a free string that can produce `Invalid Date` and a 500.

**Fix:** add a storage-backed upload endpoint (copy the `product-document.controller.ts` pattern), bind documents to the uploader, and derive `mimeType`/`fileSize` from the stored object.

### 4.4 KYC admin actions are attributed to the wrong table `[medium]`
`kyc-admin.controller.ts` records `@CurrentUser().id` (users table) as `createdById`/`reviewedById`, so an approval cannot be joined to the admin who made it. Use `@CurrentAdmin()`.

### 4.5 KYC `SELLER` audience requirements never apply `[low]`
`audienceFor()` hard-codes `BUYER`, so requirements marked `seller` are invisible.

### 4.6 Chat has no delivery or notification path `[low]`
Messages are stored but a recipient only sees them on refetch; nothing notifies. `listConversations` also issues per-conversation queries (participant lookup, last message, unread count) — an N+1 that will bite on a busy inbox.

---

## Phase 5 — Latent risks (correct today, will break later)

| # | Risk | Why it will bite | Fix |
|---|---|---|---|
| 5.1 | **No migration baseline; dev runs `synchronize`** | Items 1.3 and 1.4 *require* partial unique indexes that `synchronize` cannot express; production schema will silently diverge from entities | Generate a baseline migration, disable `synchronize` outside dev, add migrations to CI against a real Postgres |
| 5.2 | **CI has never completed a run** | Zero safety net while the fixes above land | Re-run and fix the workflow; treat a queued-forever run as a blocker, not a pass |
| 5.3 | **Full-text search has no GIN index** | `to_tsvector(...) @@ plainto_tsquery(...)` is a sequential scan; fine at 3 lots, dead at 30k | Add a GIN index on the expression (or a generated `tsvector` column) and a `pg_trgm` index for prefix search |
| 5.4 | **Cron overlap guard is a boolean in one process** | With two app instances both run settlement/escrow sweeps concurrently; the product lock saves settlement but not escrow sweep or reconciliation | Move every cron behind the queue (pattern already exists), or take a Postgres advisory lock per job |
| 5.5 | **Existing escrow holds are gross** | After 1.1, historical rows are wrong and already-released ones were overpaid | Reconciliation migration + a decision on clawback |
| 5.6 | **`accessToken` sits in the NextAuth session** | It is readable by any client script, so one XSS steals a full API bearer token | Move privileged calls server-side, or issue short-lived scoped tokens |
| 5.7 | **`USE_MOCK_FALLBACK` masks 404/5xx in dev** | A broken endpoint renders plausible fake data, which is exactly how the frontend wiring bugs in Phase 3 went unnoticed | Make the fallback opt-in and log loudly when it fires |
| 5.8 | **`/products/mine` is unpaginated** | Returns every lot the account owns; a large seller gets a huge payload | Add page/limit like `findAll` |
| 5.9 | **Withdrawal has no idempotency key** | A retried request debits twice; the balance lock prevents overdraft, not duplicate intent | Accept and dedupe on a client reference |
| 5.10 | **Redis is optional and unmonitored** | In production the queue silently degrades to inline settlement with only a log line | Alert on queue-unavailable; make it required in production config |
| 5.11 | **Refund leaves the order PAID and the lot SOLD** | Buyer keeps a paid order after a refund and the lot can never be resold | Cancel the invoice/order and reset product status inside the refund transaction |
| 5.12 | **`normalizeAuction` collapses status to `sold\|active`** | The `live`/`new` branches in the UI are unreachable dead code | Map the real status through |
| 5.13 | **Lot gallery uses static images** | `page.tsx:82` passes `images`/`auctionDetails` from mock data, so every lot shows stock art | Pass `auction.images` |
| 5.14 | **`direct_sales_section` links to `/<slug>`** | No such route; every card 404s | Point at `/auctions/[slug]` |

---

## 6. Decisions needed before implementation

1. **Escrow economics (1.1):** hold net-to-seller only, or hold gross with the platform portion tracked separately? Affects refunds and dispute reasoning.
2. **Overpaid historical payouts (5.5):** claw back, or write off and document?
3. **Seller fee self-service (2.4):** clamp to platform floors and keep, or move to admin approval only?
4. **Buyer KYC enforcement (4.3):** once documents are required, does bidding stay ungated (current behaviour) or gate on `isVerified`?

---

## 7. Suggested execution order

```
Week 1   CI green (5.2) · migration baseline (5.1) · Phase 1 items 1.2, 1.9   [pure bugs, no decisions]
Week 2   Phase 1 items 1.1, 1.3, 1.4, 1.5, 1.6                              [after decision 1]
Week 3   Phase 2 items 2.2, 2.3, 2.5, 2.7, 2.8, 2.9, 2.10
Week 4   Phase 3 (one fetch helper, then mechanical migration) · Phase 4 items 4.1, 4.2, 4.4
Week 5   Phase 4 item 4.3 (needs upload endpoint) · Phase 1 items 1.7, 1.8, 1.10 · Phase 5 sweep
```

**Definition of done per item:** regression test that fails before and passes after · `npm run build` clean · full suite green · lint 0 errors · the behaviour verified against the running API or browser, not just asserted in a test.

---

## 8. What is verified correct — do not re-fix

Recorded so a future session does not "repair" working code:

Bid ↔ settlement serialization (both take `pessimistic_write` on the product then re-check status) · the bid engine's single-transaction winner/`currentBid`/`totalBids` update · the proxy resolver's monotonicity and ceiling respect · the reserve-price floor in settlement · `applySucceeded` per-payment idempotency and amount-mismatch refusal · webhook signature verification failing closed · invoice numbering via `pg_advisory_xact_lock` · wallet deposit/credit row locks and `wallet_transactions.reference` dedupe · chat participant checks and the `{id,name}` sender projection · watchlist scoping · `AdminRolesGuard` failing closed without `@AdminRoles` · registration blocking `role=admin` · `sanitizeUser`'s allow-list · the server-side data layer forwarding the session token.

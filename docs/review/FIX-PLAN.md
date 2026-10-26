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

## 6. Decisions — ANSWERED 2026-10-23

The four blockers below are now decided. These answers drive the implementation described in §6.1.

1. **Escrow economics** → **Hold the buyer's full bill, pay the seller the net.** Every surface shows an itemised breakdown: bid, buyer premium, VAT, other charges, fixed fee, and the grand total for the buyer; bid, platform commission, tax, and the net for the seller. The platform keeps commission and VAT.
2. **Overpayment** → **Structurally prevented.** The seller's payout is derived from the stored breakdown, never from the gross total, and each seller can see the full calculation for every lot they sold.
3. **Seller fee self-service** → **Allowed as an option, with platform commission fixed.** Seller-editable fields are bounded by admin config; `buyerFeePct` (platform revenue), `sellerFeePct` (platform revenue) and `vatPct` (statutory) are admin-only. Additionally a seller may mark a lot "final bid subject to my approval" and approve or decline the winning bid after close.
4. **KYC enforcement** → **Sellers may create listings, but a lot cannot go public until KYC passes.** A compliance score is computed from approved documents against the admin-authored requirements and mapped to a risk band; the admin sees that and decides whether the seller may publish.

### 6.1 Design notes for the answered decisions

**Buyer bill vs seller receipt (one breakdown, two views).** `computeFeeBreakdown` is the single source of truth and already returns both sides. It is fixed to round each component to 2dp and derive `total`/`sellerNet` from the rounded values, so the printed lines always sum to the total charged.

```
Buyer pays:   bid + buyerPremium + vatOnBid + vatOnBuyerFee + otherCharges + fixedFee
Seller gets:  bid − sellerFee
Platform keeps: buyerPremium + sellerFee + vatOnBid + vatOnBuyerFee + otherCharges + fixedFee
```

**Escrow split.** The hold stores all four amounts (`buyerTotal`, `sellerNet`, `platformShare`, `vatAmount`). Release credits `sellerNet` to the seller's wallet and books `platformShare` as platform revenue. VAT is never paid to either party.

**Risk analysis (decision 4).** A weighted compliance score over required requirements, banded:

| Score | Band | Effect |
|---|---|---|
| ≥ 90% | low | admin may approve publishing |
| 60–89% | medium | admin review required, higher scrutiny |
| < 60% | high | publishing withheld until more documents are approved |

Signals that lower the band independently of score: unverified email, any expired document, a rejected document, or lots above a configurable value threshold. The score is advisory — the admin makes the final publish decision, as requested.


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

## 9. Delivery status (2026-10-24, pass 3)

Verified locally: backend **49 suites / 377 tests**, 0 lint errors; frontend `tsc` clean, **18 files / 85 tests**. Every item below was also exercised against the running API (`:3001`), not only in jest.

### Done — pass 2 (money, KYC, security)

| Phase | Item | Result |
|---|---|---|
| 0 | Decimal safety (root cause of 1.2/1.9) | Shared `decimalTransformer` applied to every money column on `Wallet`, `Invoice`, `Product`, `Bid`, `EscrowHold`; `toMoney`/`roundMoney` at the boundaries. `Number(a) + 'b'` can no longer concatenate. |
| 0 | Rounding + `otherCharges` (1.7, 1.8) | `computeFeeBreakdown` rounds each component once and derives `total`/`sellerNet`/`platformShare`/`vatTotal` from the rounded values. Invoice persists `other_charges`, `seller_net`, `platform_share` and no longer excludes `otherCharges` from the total. |
| 1 | **1.1 escrow economics** | Hold stores the buyer bill **and** its split (`sellerNet`, `platformShare`, `vatAmount`). Both release paths and the auto-release sweep credit the seller **net only**. |
| 1 | **1.4 duplicate charge** | `findLiveForInvoice` + partial unique index `UQ_payment_live_per_invoice`. A retry reuses the in-flight payment instead of opening a second checkout. |
| 1 | **1.5 client reference** | Reference is always server-generated; `findByReferenceForUser` scopes lookups to the owner. |
| 2 | **2.1 verify guard** | `AdminRolesGuard` + `@AdminRoles` (fixed in the previous pass). |
| 2 | **2.5 PII leak** | Public seller profile now uses an allow-list projection; reviews re-projected without `bidder_id`. Verified: no `tax_id`, `email`, `phone`, `commission_rate`, `user_id` on the unauthenticated route. |
| 2 | **2.7 reset token** | `typ: 'password_reset'` claim; `JwtStrategy` rejects any non-`access` purpose; `resetPassword` also refuses inactive accounts. |
| 2 | **2.8 route order** | `@Get('payouts')` moved above `@Get(':id')`. |
| 3 | **Decision 1 & 2 — buyer/seller breakdowns** | Buyer: `/fees/breakdown` returns bid, premium, VAT, other charges, fixed fee, total. Seller: new `GET /sellers/me/earnings` returns per-lot hammer / premium / VAT / commission / net plus escrow state. Frontend helpers `getBuyerPriceBreakdown()` and `getSellerEarnings()`. |
| 4 | **Decision 4 — KYC publish gate** | `KycRiskService` computes a weighted compliance score, bands it low/medium/high with independent signals, and `ProductService.approve()` refuses to publish unless KYC is approved **and** an admin has authorised publishing. Admin routes `GET /admin/kyc/sellers/:id/risk` and `POST /admin/kyc/sellers/:id/publish`. |
| 4 | Audit trail inert (4.1) | `AuditInterceptor` writes a row for every mutating `/admin/` call. Verified: the publish decision produced the first audit row the system has ever had. |
| 4 | Metrics inert (4.2) | `MetricsInterceptor` feeds `recordHttpRequest`. Verified: `http_requests_total` and `http_request_duration_seconds` now appear. |

### Verified end-to-end

- Buyer bill reconciles: bid 100,000 → premium 10,000 + VAT 8,250 = **total 118,250**; **sellerNet 95,000**; **platformShare 15,000**; and `95,000 + 15,000 + 8,250 = 118,250`.
- KYC gate: approving a lot returned **403 "Awaiting admin approval to publish"**; after `POST /admin/kyc/sellers/:id/publish {approved:true}` the same call succeeded and the lot went `active`.

### Done — pass 3 (this arc)

| Phase | Item | Result |
|---|---|---|
| 1 | **1.3 duplicate escrow hold** | `holdInManager` catches the `23505` unique-violation from `UQ_escrow_open_per_invoice` and returns `null` — the racing webhook gets the same "already held" outcome as the locked SELECT. Tests: race + rethrow. |
| 1 | **1.6 payment status transitions** | Transition table on `PaymentService.updateStatus`: `PENDING → succeeded/failed/cancelled` only; `SUCCEEDED` is terminal (same-status metadata writes stay legal). Webhook receives late `FAILED` reports for settled payments as a clean no-op ack; reconciliation logs an explicit `INCONSISTENCY` when the provider contradicts a settled payment instead of touching it. Tests: 4. |
| 2 | **2.2 seller-document IDOR** | `SellerDocumentService.update/remove/findById` accept the caller's `sellerId` and scope the lookup; controller passes `seller.id`. A seller touching another's document now gets 404. |
| 2 | **2.3 admin-by-email** | `admins.user_id` (unique) links the JWT account; `AdminRolesGuard` resolves authority **only** through that link (email match removed), requires `isEmailVerified`, fails closed when the DB is unreachable, and deactivation is an explicit rejection (was swallowed by try/catch). `createAdmin` links automatically; the seed backfills legacy rows. Live-verified: the linked-but-unverified `admin@test.com` gets **403 "Verify your email address…"** on `/admin/audit`. Tests: 8. |
| 2 | **2.4 / Decision 3a — fee policy** | `PUT /sellers/settings/fees` now accepts **only** the two toggles (`buyerFeeEnabled`, `sellerFeeEnabled`). `buyerFeePct`/`sellerFeePct`/`vatPct`/`vatBase` are rejected by the DTO whitelist (live-verified 400) and live exclusively behind the admin fee endpoints. `GET /fees/overrides` is admin-guarded (was public). |
| 2 | **2.6 public `status` filter** | `ProductService.findAll` forces `ACTIVE`; the DTO still accepts `status` so old clients don't 400, but it is ignored. Live-verified: `?status=draft` returns active rows only. |
| 2 | **2.9 untyped `@Body()`** | DTOs with class-validator rules for `auth/change-password`, `auth/send-otp` (6-digit), `auth/verify-otp`, `wallet/deposit`, `wallet/withdraw` (4–6 digit PIN), `wallet/pin`; global ValidationPipe enforces them. |
| 2 | **2.10 review integrity** | `POST reviews/:id/helpful` requires JWT + per-user throttle; a seller cannot review their own profile or vote helpful on reviews of it. Tests: 3. |
| 3 | **Decision 3b — winner subject to seller approval** | `Product.requiresSellerApproval` + optional `approvalThreshold` (bids ≥ threshold auto-settle). Settlement parks such lots in the new `AWAITING_SELLER_APPROVAL` state and notifies the seller; `POST /products/:id/approve-sale` re-resolves fees and issues the invoice at decision time, `…/decline-sale` closes the lot unsold and notifies the buyer. Ownership enforced; 6 new settlement tests. |
| 3 | Frontend wiring (Phase 3) | New `shared/utils/api-client.ts` (`apiFetch` + `ApiError`); migrated the money screens (purchases, sales, invoices view, wallet, checkout) and ~20 admin surfaces (settings modules, AI islands, agents dashboard, FAQ/banner/seller/category actions) that were calling guarded endpoints with **no Authorization header** — they all 401'd silently. Invoice-PDF downloads now authenticated. Checkout posts exactly `CreateOrderDto { invoiceId }` (the full form payload was 400ing on the whitelist) and redirects with `?invoiceId=` to match the payment page. |
| 3 | Demo data removed on money screens | Purchases table, seller payments accounts, buyer wallet (₦20M dummy balance and dummy payments gone — real balance, real ledger rows, honest empty states), admin audit logs now render the real `GET /admin/audit` feed. `NEXT_PUBLIC_USE_MOCK_FALLBACK` mock fallbacks are now **opt-in** env with a loud warning when enabled (was: on in every non-production run). |
| 3 | Bid history wired | `useGetAuctionBidsQuery` feeds `bidding.bidHistory` (new `setBidHistory` action); "Total Bids" and the history table show real bids instead of 0. |
| 3 | Seller listings mapped | `/seller/auctions` maps `/products/mine` rows → `Listing` (lot id, title, image, reserve, bids, date, time left, status incl. "Ending Soon") instead of a blind cast that rendered blanks. |
| 3 | Filters/sorts | Country + price-range filters and `newest`/`ending-soon` sorts now apply; the fake Brands filter (no brand concept exists end-to-end) was removed rather than left lying; homepage category links fixed (`subcategory` casing). RTK `getAuctions` params mapped to the real `ProductQueryDto`. |
| 3 | Status mapping / gallery / links (5.12–5.14) | `normalizeAuction` maps every real backend status (new `ended` bucket for closed/expired/awaiting-approval — dead `live` branch is reachable, non-public states never render as active); lot gallery uses `auction.images` + the lot's real `specifications` table (was static mock art/details); direct-sales cards link to `/auctions/[slug]` (was a nonexistent `/<slug>` route). |
| 5 | **5.1 migration baseline** | All 5 pre-existing migrations recorded in the `migrations` table (the schema they describe is live via synchronize); new `MoneyBackfillAndFts1790000000000` migration adds every column/index from this arc and **ran for real** (`npm run migration:run` green). |
| 5 | **5.3 search GIN index** | `IDX_products_fts` expression index mirroring the exact `to_tsvector` predicate in `ProductService.findAll`. |
| 5 | **5.5 money backfill** | Legacy invoices recomputed (`seller_net`, `platform_share`) and escrow holds inherit the invoice split — live-verified `INV-2026-000002` now reports net 250,000 instead of 0. Already-released holds were overpaid gross; the row data is corrected but clawback stays a business decision. |
| 5 | **5.4 cron advisory locks** | New `AdvisoryLockService` (Postgres session advisory lock held on one pooled connection) wired into settlement, escrow auto-release and payment-reconciliation crons — two app instances no longer double-run the sweeps. |
| 5 | **5.8 `/products/mine` pagination** | `page`/`limit` (default 50, cap 200), response `{ items, total }`. |
| 5 | **5.9 withdraw idempotency** | Client `reference` on withdrawals: pre-check + unique-index race fallback return the original transaction (`idempotent: true`); a retry can no longer debit twice. Tests: 2. |
| 5 | **5.11 refund unwinds the sale** | Escrow refund cancels the invoice and any order and flips a still-SOLD lot to CLOSED in the same transaction (guarded so a relisted re-sale is untouched). |

### Verified end-to-end (live, :3001)

- Public grid ignores `?status=draft` — only `active` rows return.
- `PUT /sellers/settings/fees { buyerFeePct }` → **400** `property buyerFeePct should not exist`; `{ buyerFeeEnabled }` → 200.
- `GET /fees/overrides` anonymous → 401, admin → 200.
- `POST /reviews/:id/helpful` anonymous → 401.
- Withdraw with the same client reference twice → one debit, second call `idempotent: true` with the original transaction id.
- Linked-but-unverified admin (minted JWT for `admin@test.com`) → **403 "Verify your email address before accessing admin endpoints"** on `/admin/audit`.
- Backfilled invoice: `INV-2026-000002` → hammer 250,000 / **seller_net 250,000** / platform_share 25,000.
- Migration run: 6 migrations recorded, `IDX_products_fts`, both partial unique indexes and `UQ_admin_user` present.

### Done — pass 4 (the gaps from pass 3, closed)

| Item | Result |
|---|---|
| **5.2 CI failures** | Root-caused from the actual runs, not guessed: the Frontend job failed on exactly **3 `no-explicit-any` lint errors** (all in files from pass 3) and Lighthouse failed because `lighthouserc.json` asserted an audit id **`tbt`, which does not exist** — the failure was `auditRan`, not a budget breach. Both fixed (typed the payload/bid mapping, removed the bogus assertion; the real `total-blocking-time` assertion was already there). Local lint is 0 errors and `next build` now emits `/api/proxy/[...path]`. |
| **4.3 KYC upload endpoint** | `POST /kyc/documents` is now **multipart only**: the file is stored through `StorageService`, and `mimeType`/`fileSize`/`fileUrl` are derived from the stored object, so the MIME and size policy can no longer be bypassed by asserting metadata. Requirement policy is checked **before** the bytes are stored (no orphaned objects), the stored object is deleted if the record fails, `expiresAt` must be a real future date (the old `new Date(bad)` threw a 500), and a replacement deletes the superseded row **and** its file. Live-verified: upload 201 with server-derived size/MIME, `application/zip` → 400, past expiry → 400, and exactly one row remains per requirement. |
| **4.4 KYC attribution** | `AdminRolesGuard` now exposes the resolved `admins` row (`request.admin`) and `@CurrentAdmin()` returns it, so `createdById`/`reviewedById`/`publish_decided_by` record the admin identity rather than the users-table id. Applied to the KYC admin routes; the decorator change upgrades every other admin-attributed column at once. |
| **4.5 SELLER audience** | `audiencesFor(userId)` unions BUYER + SELLER for an account that has a seller profile, so seller-scoped requirements are no longer invisible. Test asserts the query. |
| **4.6 Chat delivery + N+1** | A message now notifies the recipient (`new_message`, preview truncated, deep link) — fire-and-forget so a notification failure never fails a send. `listConversations` went from three queries **per conversation** to a fixed set of batched queries (`DISTINCT ON` for the last message, `GROUP BY` for unread counts), and `getUnreadCount` from N queries to one aggregate. Fixed a related bug found in the same function: the list used the context-free `otherParticipantId` getter, so the "other participant" could be the caller. Live-verified: the `new_message` notification row exists for the recipient. |
| **Approval expiry (3b terminal state)** | New `products.approvalRequestedAt` (indexed) is set when settlement parks a lot; a 10-minute advisory-locked sweep closes lots whose seller never answered after `SELLER_APPROVAL_WINDOW_HOURS` (default 72), re-checking under a pessimistic lock so a late decision wins. Both parties are notified (buyer gets an explicit "did not approve in time" reason, seller gets a relist prompt). Migration `1795000000000` backfills existing parked lots from `updatedAt`. |
| **5.10 Redis / queue monitoring** | `settlement_queue_available` gauge plus `settlement_queue_unavailable_total` and `settlement_inline_total` counters, a `QueueHealthService` that probes every 60s and logs at **error** level once per transition (not per probe), and `QUEUE_REQUIRED` (default on in production) so a degraded topology is called out. Live-verified: the metrics are exported and the gauge correctly reads **0** with Redis down. |
| **5.6 `accessToken` exposure** | Closed with a same-origin BFF proxy: `app/api/proxy/[...path]` reads the bearer token from the HTTP-only Auth.js JWT and forwards it, and the session object **no longer carries the token at all** (`session.user` = `id, email, name, role`). Server code reads the JWT via `getToken()`; the browser base URL is `/api/proxy` so even the ~20 legacy raw `fetch` call sites are authenticated by cookie. The proxy authenticates but does not authorise (public endpoints stay public; guarded ones answer 401 themselves). Browser-verified 11/11: anonymous catalogue works, anonymous wallet is refused, authenticated wallet works, admin-guarded route works, no JWT anywhere in rendered HTML. |
| **Withdraw flow (was never wired)** | Found while adopting the idempotency key: the modal's steps were cosmetic — the amount and PIN were discarded and **nothing was ever posted**, and the PIN was checked against a hardcoded `'1234'` in the browser. Now the flow carries amount + PIN + a per-flow `reference` into `POST /wallet/withdraw` (retry reuses the reference, so it dedupes), the server validates the bcrypt PIN, the wallet refreshes after success, and the "add account"/"set PIN" steps persist to `sellers/profile/me` and `POST /wallet/pin` instead of faking verification with a hardcoded name and a mock OTP. |
| **Sales-view export** | Implemented as a real CSV of the invoice table (proper quoting, dated filename). |

### Done — pass 5 (unbuilt / inert surfaces, verified phase by phase)

Found by an audit of the frontend rather than the earlier defect lists: the same
"backend works, last mile missing" pattern.

| Item | Result |
|---|---|
| **Seller Messages page was permanently empty** | `GET /sellers/me/conversations` was a documented stub returning `[]` while the chat module held the data. It now delegates to `ChatService.listConversations`, `lib/server/data.ts` maps the chat row onto the seller UI model (it previously cast a different shape, so even real data would have rendered blanks), and the chat view fetches the thread and identifies own/other bubbles from the real session id instead of a hardcoded `'seller-1'`. Verified as a real seller account: list renders, thread loads, a message sent from the UI persists. |
| **Admin Enable/Disable, Activate/Deactivate and Suspend were no-ops** | Three tables rendered `status` from a field the API never sends (`isActive`), so every row looked active and the menu items called nothing. Data layer now maps `isActive` → the UI status string (banner Active/Inactive + Visible/Hidden, FAQ, admin Active/Suspended), and each table PATCHes `isActive` through the proxy, toasts and refreshes. Verified 7/7 (API) and 6/6 (browser: a row flipped to Inactive and the server agreed). |
| **Listing-card heart never saved** | Its sync was gated on the now-empty Redux token, so the request never fired, and it always POSTed — un-hearting kept the row server-side. Now gated on the session, POST adds / DELETE removes with rollback, and guests are told to sign in instead of getting a fake local toggle. Verified 8/8 in the browser. |
| **KYC had no UI at all** | Built all three surfaces: an account-holder checklist with upload (multipart through the proxy), the admin review queue with approve/reject + reasons, the compliance assessment with band/score/signals, and the separate publish decision. Requirements are managed by the admin (create/deactivate) — nothing hardcoded. Reachable from both dashboards (buyer module + seller settings) since KYC is account-holder level. `apiFetch` now forwards `FormData` untouched. Verified 13/13 end-to-end: buyer upload → queue → admin approve → publishing decision on a real seller. |
| **Misleading publish button for non-sellers** | Found while testing: the console offered "Approve publishing" to a pure buyer, where the call correctly 404s. `publishingStateFor` now reports `hasSellerProfile`, and the console explains there is nothing to decide instead of showing buttons that cannot work. |

### Done — pass 6 (currency decision, admin write validation, monitoring)

| Item | Result |
|---|---|
| **Multi-currency — decision: NGN-only checkout** | No FX at charge time. `payment init` refuses an invoice whose currency is not NGN, naming the invoice currency and the reason, and nothing is persisted for a refused charge; the orchestration boundary also refuses a non-NGN deposit (in practice the init DTO already rejects a `currency` field, so that gate is defence in depth). The payment page reads the invoice currency, explains that it cannot be paid online, and disables Place Order instead of letting the buyer fill a card form for a charge that will be refused. 3 orchestration tests + 7/7 live checks. |
| **Admin content writes were unvalidated** | FAQs, banners and content pages took `@Body() dto: any` straight into `repo.update(id, dto)` — untyped mass-assignment on admin routes, so `id`, `createdAt` or any other column could be written. Each now has a DTO with real constraints (required fields, URL validation on the banner link, bounded lengths, integer ordering); unknown properties are rejected by the global pipe. The audit-log route reuses the `CreateAuditLogDto` that already existed. The admin forms sent whole rows on save, which the new validation would reject, so they now send only whitelisted fields and surface failures. Verified 11/11. |
| **Product-document "TODO: add proper admin check"** | Stale: `JwtAuthGuard + AdminRolesGuard + @AdminRoles` has been on the route all along. The comment is replaced by what actually enforces it, and attribution now uses `@CurrentAdmin()` — verified that `verifiedById` equals the admins row id, not the users row. |
| **Agent monitoring was a placeholder** | "Real-time agent metrics and logs. Coming soon." while `/admin/agents/metrics` returned them. Now a real table (agent, event, success/failure with error, latency, cost), per-agent filter, summary cards derived from the same rows, 15s live refresh that can be paused, and an honest empty state. Verified against a real execution row. |

### Remaining — outside code

| Item | State |
|---|---|
| CI green run | **Done** — run `40290584210` finished `success` with all three jobs green (Backend 1m38s, Frontend 2m9s, Lighthouse 3m27s). First successful run in the repo. |
| Approval-expiry live tick | Covered by two unit tests (expiry + concurrent-decision race); not exercised against the running API because the next cron tick is up to 10 minutes away. |
| Clawback of overpaid released escrow holds | Business decision: the row data is corrected by migration, but money already paid out is not recovered automatically. |
| Bank-account name resolution | The add-account step saves the account as entered and says so; there is no name-enquiry provider wired, so nothing claims the name was verified. |
| Settings sections still take an untyped body | `PUT /settings/:section` accepts `@Body() dto: any`; each section has its own shape, so validating it needs a per-section DTO set rather than one blob. Admin-only. |
| Product-document uploads assert their own metadata | `POST /products/:productId/documents` still takes a client-supplied `fileUrl`/`size`/`mimeType` (the same gap fixed for KYC in pass 4); it should become a storage-backed multipart upload. |
| Chat has no realtime | Messages are persisted and notified, but the open thread needs a refetch; the socket gateway covers bids, not chat. |
| OPay / Interswitch webhooks | Vendor signature schemes unconfirmed; both fail closed, so nothing can be forged — they simply cannot settle until confirmed. |
| Agent execution needs a provider | The probe run recorded a failed metric because no AI provider is configured in dev; monitoring now shows that honestly rather than hiding it. |

### Dev-data changed while testing

- Admin user (`d1dd9a27…`) has `publish_approved = true`; lot `bfe1f6de…` moved `pending_approval → active` (pass 2).
- All 5 `admins` rows now carry `user_id` (backfill); fee toggles for the admin seller were switched on/off during verification and left `enabled`.
- A 5,000 dev wallet deposit + 1,000 withdraw (reference `verify-wd-1`) were made on the admin seller's wallet to prove withdrawal idempotency.

### Backfill needed before this reaches real data

**Done** in migration `MoneyBackfillAndFts1790000000000` (see pass-3 table). Remaining clawback decision for overpaid released holds is recorded above.

---

## 8. What is verified correct — do not re-fix

Recorded so a future session does not "repair" working code:

Bid ↔ settlement serialization (both take `pessimistic_write` on the product then re-check status) · the bid engine's single-transaction winner/`currentBid`/`totalBids` update · the proxy resolver's monotonicity and ceiling respect · the reserve-price floor in settlement · `applySucceeded` per-payment idempotency and amount-mismatch refusal · webhook signature verification failing closed · invoice numbering via `pg_advisory_xact_lock` · wallet deposit/credit row locks and `wallet_transactions.reference` dedupe · chat participant checks and the `{id,name}` sender projection · watchlist scoping · `AdminRolesGuard` failing closed without `@AdminRoles` · registration blocking `role=admin` · `sanitizeUser`'s allow-list · the server-side data layer forwarding the session token.

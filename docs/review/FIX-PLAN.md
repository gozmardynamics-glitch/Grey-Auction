# Grey Auction — review & fix plan

**Living document. Last updated 2026-10-26.**

This file used to carry the full defect catalogue plus a pass-by-pass delivery
log. Completed work has been removed — **only pending work is listed below**.
The history is in git (`git log --oneline -- docs/review/FIX-PLAN.md`).

Every item here is something that is *not* done. If you fix one, delete it from
this file and describe it in the commit message instead.

---

## 1. Pending work

Found by a role-by-role wiring audit (admin / seller / buyer-corporate). Items
are grouped by what breaks if left alone.

### P1 — blocked on a decision or an external input

| # | Item | Why it matters | Where | Next step |
|---|---|---|---|---|
| 1 | **Overpaid escrow holds** | Holds released before the payout split existed were paid the buyer's gross amount. Row data is corrected; the money has moved. | `backend/src/escrow/escrow.service.ts` | Finance decision: absorb, offset a future payout, or invoice. Then optionally an admin report listing holds whose components do not reconcile. |
| 2 | **OPay webhook signature** | OPay cannot settle. Fails closed, so nothing can be forged. | `backend/src/payments/providers/opay.provider.ts:26` | Confirm the header name from OPay's docs, implement, replay a sample payload in a test. |
| 3 | **Interswitch IPN signature** | Same for Interswitch. | `backend/src/payments/providers/interswitch.provider.ts:27` | Confirm the signing scheme, implement, test. |
| 4 | **Bank-account name resolution** | The withdraw add-account step saves what was typed and says it cannot verify the name. | `frontend/shared/components/add_account_steps/add_account_step.tsx` | Needs a name-enquiry provider + key; wire behind an env flag, keep the honest wording otherwise. |

### P2 — money and trust flows that still do not work

| # | Item | Why it matters | Where |
|---|---|---|---|
| 5 | **Seller payout withdrawal is theatre** | The 6-step dialog never calls `POST /sellers/payouts/request`, the PIN is not verified, and the review step only closes. `payment_actions.tsx` computes the balance from `status === 'Completed'` against lowercase payout rows, so it reads ₦0 and blocks withdrawal anyway. `getSellerPayments()` also casts raw payout rows to `AdminPayment`, leaving the table columns blank. | `seller/payment/components/withdraw_modal.tsx`, `seller/_islands/payment_actions.tsx`, `lib/server/data.ts` (`getSellerPayments`) |
| 6 | **Admin "Add seller" makes the ADMIN a seller** | `POST /sellers/register` attaches the profile to the *caller*, and there is no admin route to create a seller for another account. The form now sends a valid body, so it succeeds — with the wrong owner. | `frontend/app/[locale]/(domain)/admin/_islands/add_seller_action.tsx`, needs a backend admin endpoint |
| 7 | **Buyers cannot see invitations they received** | `GET /invites/pending` returns invites *created by* the caller. Nothing exposes invitations *received*; they only arrive as email links. The invitations module now lists the caller's own sent invites instead of every private room (which it used to leak). | backend `invites` module needs a received-invitations route |
| 8 | **Seller bidding room: create + invite** | `create_room.tsx` omits required `startTime`/`endTime`; `invite_bidder_modal.tsx` fabricates a `/invite/demo-…` link when the call fails; `getSellerBiddingRooms()` casts raw `Room` rows to `BiddingRoom` so the table is blank. `GET /rooms` is also public and returns every tenant's rooms. | `seller/bidding-room/**`, `lib/server/data.ts`, backend `rooms` controller |
| 9 | **Create-listing wizard loses data** | `imageFiles = []` so `images` is always empty (no upload call), and the `lotAndInventory` step is never sent; there is no draft save. | `seller/auctions/create_listing/page.tsx` |
| 10 | **Tab filters disagree with the data** | Admin payments tabs use `Successful` while rows say `Completed`, so that tab is empty; bids `Ending` has no source. | `admin/payment/components/*`, `admin/bids/components/*` |
| 11 | **Purchase detail invents the fee** | Recomputes a hardcoded 19% premium instead of using the invoice line items, so the displayed total can disagree with the invoice. | `buyer/dashboard/components/purchases/purchase_detail.tsx:28-33` |
| 12 | **Currency formatting ignores the invoice currency** | `formatCurrency` is NGN-only; rows carry `currency`. Checkout is NGN-only by decision, but display should not mislabel. | `shared/utils/helpers.ts` |
| 13 | **Dashboards still show placeholders** | Seller dashboard stat cards are hardcoded `0`, `total_revenue` renders 12 mock months, `ListedAuctions`/`Messages` get no data; admin dashboard cards are `0` with mock charts. | `seller/dashboard/**`, `admin/_islands/admin_dashboard.tsx` |
| 14 | **Admin settings fake-save** | `auctions.tsx`, `preferences.tsx`, `payments.tsx` "Save changes" are empty handlers that toast success (no endpoint exists for those sections). | `admin/settings/components/modules/*` |
| 15 | **Agent studio sub-pages are stubs** | `agents/instances`, `agents/tools[/:id]`, `agents/workflows[/:id]` are one-line placeholders; only the settings editor for a single agent is real. | `admin/agents/**` |
| 16 | **Room status casing** | `GET /rooms` returns `scheduled|live|closed|…`; the room detail modal branches on capitalised labels, so its right column is empty on live data. | `admin/bidding-room/components/room_details_modal.tsx` |

### P3 — accepted, low value

| # | Item | Note |
|---|---|---|
| 17 | Dead buyer modules (`account`, `auctions`, `authentications`, `messages`) | Not referenced by `MODULE_MAP`; leftovers to delete. |
| 18 | Chat has no typing/presence | Delivery is live over `/chat`; typing/presence was never promised in the UI. |
| 19 | Agent monitoring polls every 15s | Says so on the page and can be paused; move to the socket only if too coarse. |
| 20 | `METRICS_TOKEN` unset in dev | `/api/metrics` is open until the env var is set; production should also keep it on an internal interface. |

### Fixed in the role-wiring pass (for context, no action needed)

Onboarding was broken end to end and is now verified working: organization
registration sent a `categories` field the DTO rejects, an invalid `COMPANY`
business type and an empty required `postal_code` — it reported success while
failing, and it posted through an absolute URL. `postal_code` is now optional in
the DTO (the column defaults to `''`), the payload matches the DTO, failures are
reported honestly, the proxy forwards a caller-supplied bearer for pre-login
calls, buyer `complete_profile` sends only DTO fields, forgot-password navigates
with the reset token only when one exists, and the OTP page verifies against the
API instead of navigating blindly. Seller settings (profile, security, store,
payment terms, fees/payouts) now save through the proxy with real error
handling; the fee screen no longer sends percentages the DTO rejects. Buyer
dashboard stats, bids, recent invoices, notifications and the payout-account
card load real data or show honest empty states, and the invitations module no
longer lists every private room. Admin tables (categories, payments, buyers,
sellers, bids, auctions, tickets) map the API onto what the columns render —
the tickets page used to crash on the first real ticket — buyer
suspend/activate uses the real POST routes, auction moderation calls the product
approve/reject endpoints (with the modal gate fixed for lowercase statuses), the
legal-page editors are real client editors sending `{title, content}`, the three
create-user payloads match their DTOs, and the FAQ "Add Category" affordance was
removed because no such endpoint exists. KYC reviews now notify the applicant,
and unverified lot documents are no longer publicly listable.

## 2. Decisions already taken — do not reopen

| Decision | Chosen behaviour |
|---|---|
| Escrow economics | The hold stores the buyer's whole bill; the seller is credited **net**; the platform keeps its share; VAT belongs to neither party. Invariant: `sellerNet + platformShare + vatTotal === total`. |
| Fee policy | Platform commission is fixed by an **admin** (`buyerFeePct`, `sellerFeePct`, `vatPct`). A seller may only toggle whether each fee applies. |
| Final bid subject to seller approval | Optional per lot (`requiresSellerApproval` + `approvalThreshold`). Settlement parks the lot in `awaiting_seller_approval`; the seller accepts (invoice issued) or declines (lot closed). Unanswered lots expire after `SELLER_APPROVAL_WINDOW_HOURS` (default 72). |
| KYC vs publishing | KYC approval is **not** publishing consent. The compliance score/band is advisory; an admin makes the publish decision. Both are required before a lot can go public. |
| Multi-currency | **NGN-only checkout.** No FX at charge time; a non-NGN invoice is refused at payment init with an explanation. Display/rates may vary, settlement may not. |

---

## 3. Verified correct — do not "fix" these

Bid ↔ settlement serialization (both take `pessimistic_write` on the product,
then re-check status) · the bid engine's single-transaction winner/`currentBid`/
`totalBids` update · proxy/auto-bid monotonicity and ceiling · reserve-price
floor in settlement · `applySucceeded` idempotency and amount-mismatch refusal ·
webhook signature verification failing closed · invoice numbering via
`pg_advisory_xact_lock` · wallet row locks and `wallet_transactions.reference`
dedupe · the decimal transformer returning `undefined` (so column DEFAULTs
apply) · `AdminRolesGuard` failing closed and resolving authority **only**
through `admins.user_id` + a verified email · registration blocking
`role=admin` · `sanitizeUser` and the public seller allow-list projections ·
the same-origin `/api/proxy` BFF (session token never reaches client JS) ·
WebSocket auth via short-lived `typ: realtime` tickets · settings reads
admin-only with credentials redacted · single-flight payment/escrow partial
unique indexes · cron advisory locks.

---

## 4. Operating notes

**Environment (frontend).** `NEXT_PUBLIC_API_URL=/api/proxy`,
`API_URL=http://localhost:3001/api` (absolute; server-side only),
`AUTH_SECRET`, `NEXT_PUBLIC_REALTIME_URL=http://localhost:3001`.
See `frontend/.env.example`.

**Environment (backend).** `SELLER_APPROVAL_WINDOW_HOURS` (default 72),
`QUEUE_REQUIRED` (on by default in production), `DB_*`, `JWT_SECRET`.
Optional: Redis (`REDIS_URL`) — without it settlement runs inline and
`settlement_queue_available` reports 0.

**Verify before shipping.**
```
cd backend  && npm run build && npx jest && npm run lint   # 51 suites / 397 tests, 0 lint errors
cd frontend && npx tsc --noEmit && npm run lint && npm test && npm run build
```
CI runs the same steps on `main`; all three jobs (Backend, Frontend, Lighthouse)
are green. A migration baseline exists — run `npm run migration:run` after
pulling.

**Dev data touched by verification.** The following dev rows were changed while proving behaviour and are safe to reset: the lot 2019 Toyota Hilux 2.4 GD-6 (356daaed…) was parked and then closed by the approval-expiry sweep; phase1.seller@, phase4.buyer@ and wallet.probe.*@greyauction.dev are test accounts; settings.email holds a dummy SMTP host whose password reads back masked; the KYC requirement 
ational_id has one submitted document.

**Dev credentials.** `admin@greyauction.com` / `Admin@12345`
(`admin@test.com` is linked but unverified on purpose — useful for testing the
privileged-access gate).

---

## 5. Completed — summary only

Delivered across the audit: the money path (decimal safety, escrow net payout,
fee/rounding invariants, one live payment per invoice, payment status
transitions, withdraw idempotency, refund unwinds the sale) · authorization and
privacy (seller-document ownership, admin identity link, review integrity,
public profile allow-lists, reset-token purpose) · the frontend wiring
(authenticated fetch helper, demo data removed from money screens, bid history,
filters/sorts, real admin actions) · inert features (audit trail, HTTP metrics,
KYC upload/review/publish consoles, seller Messages, agent monitoring, agent
settings) · latent risks (migrations baseline + backfills, GIN search index,
cron advisory locks, pagination, queue monitoring, NGN-only checkout) · realtime
(ticket-authenticated sockets, live chat) · the LLM registry (custom
OpenAI-compatible providers usable by agents, API keys masked).

Each of those landed with tests and a live verification; `git log` has the
detail.

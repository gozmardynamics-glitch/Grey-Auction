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
| 1 | **Overpaid escrow holds** | Holds released before the payout split existed were paid the buyer's gross amount. Row data is corrected; the money has moved. | `backend/src/escrow/escrow.service.ts` | Finance decision: absorb, offset a future payout, or invoice. The admin KPI panel now reports `holdsNotReconciling`, so this is measurable. |
| 2 | **OPay webhook signature** | OPay cannot settle. Fails closed, so nothing can be forged. The provider is switched off at checkout until this is done. | `backend/src/payments/providers/opay.provider.ts:26` | Confirm the header name from OPay's docs, implement, replay a sample payload in a test, then drop `opay` from `PAYMENT_PROVIDERS_DISABLED`. |
| 3 | **Interswitch IPN signature** | Same for Interswitch; also switched off at checkout. | `backend/src/payments/providers/interswitch.provider.ts:27` | Confirm the signing scheme, implement, test, then re-enable. |
| 4 | **Bank-account name enquiry** | The *controls* exist (a changed account must rest `PAYOUT_BANK_HOLD_HOURS`, and it cannot be changed while a payout is in flight), but nothing verifies that the account name matches the seller. | `frontend/shared/components/add_account_steps/add_account_step.tsx` | Needs a name-enquiry provider + key (Paystack/Flutterwave resolve-account); store asserted vs returned name and only clear the rest early when they match. |

### P2 — money and trust flows that still do not work

| # | Item | Why it matters | Where |
|---|---|---|---|
| 5 | **Admin "Add seller" makes the ADMIN a seller** | `POST /sellers/register` attaches the profile to the *caller*, and there is no admin route to create a seller for another account. The form now sends a valid body, so it succeeds — with the wrong owner. | `frontend/app/[locale]/(domain)/admin/_islands/add_seller_action.tsx`, needs a backend admin endpoint |
| 6 | **Create-listing wizard loses data** | `imageFiles = []` so `images` is always empty (no upload call), and the `lotAndInventory` step is never sent; there is no draft save. | `seller/auctions/create_listing/page.tsx` |
| 7 | **Tab filters disagree with the data** | Admin payments tabs use `Successful` while rows say `Completed`, so that tab is empty; bids `Ending` has no source. | `admin/payment/components/*`, `admin/bids/components/*` |
| 8 | **Currency formatting ignores the invoice currency** | `formatCurrency` is NGN-only; rows carry `currency`. Checkout is NGN-only by decision, but display should not mislabel. | `shared/utils/helpers.ts` |
| 9 | **Seller dashboard charts still mock** | The stat cards, orders and payout counters now come from real endpoints, but `TotalRevenue` (12 mock months), `ListedAuctions` and `Messages` receive no data; admin `TotalRevenue`/`RegisteredUsers`/`AuctionActivity` are likewise still mock-driven behind the new KPI panel. | `seller/dashboard/components/total_revenue.tsx`, `admin/dashboard/components/*` |
| 10 | **Admin settings fake-save** | `auctions.tsx`, `preferences.tsx`, `payments.tsx` "Save changes" are empty handlers that toast success (no endpoint exists for those sections). | `admin/settings/components/modules/*` |
| 11 | **Agent studio sub-pages are stubs** | `agents/instances`, `agents/tools[/:id]`, `agents/workflows[/:id]` are one-line placeholders; only the settings editor for a single agent is real. | `admin/agents/**` |
| 12 | **Admin-settled invoices create no order row** | The webhook marks the order paid (creating one from the invoice when missing); the admin `mark paid` path does not, so a manually settled sale never appears in order tracking. Needs an orchestrator above both modules, because `OrderModule` already imports `InvoiceModule`. | `backend/src/invoices/invoice.service.ts`, `backend/src/orders/order.service.ts` |
| 13 | **Room counts are placeholders** | `bidders` is 0 in both room tables (participants are not aggregated) and `auctions` is `productIds.length`, not live lot counts. | `frontend/lib/server/data.ts` room mappers |
| 14 | **No category rows and no admin form** | `categories` is empty, so the public category navigation and the admin table show nothing; `POST /categories` exists but no screen calls it (the old "Add Category" button was removed when the endpoint was missing). | `admin/categories/**`, seed the table from the `products.category` strings |
| 15 | **An admin cannot delete another seller's lot** | `DELETE /products/:id` answers "Not your product" for an admin, so an abandoned or fraudulent lot can only be rejected, never removed. | `backend/src/products/product.service.ts` `remove()` |
| 16 | **Lots publish without photos** | The wizard hardcodes `images: []` and never uploads, so every listing created through the UI has no photograph. | `seller/auctions/create_listing/page.tsx`, needs an upload endpoint |
| 17 | **Double opt-in confirms on GET** | `/subscriptions/confirm` changes state on a GET, so a mail scanner that prefetches links confirms the subscription without the reader clicking. | make the page POST the token after a click |

### P3 — accepted, low value

| # | Item | Note |
|---|---|---|
| 18 | Dead buyer modules (`account`, `auctions`, `authentications`, `messages`) | Not referenced by `MODULE_MAP`; leftovers to delete. |
| 19 | Chat has no typing/presence | Delivery is live over `/chat`; typing/presence was never promised in the UI. |
| 20 | Agent monitoring polls every 15s | Says so on the page and can be paused; move to the socket only if too coarse. |
| 21 | `METRICS_TOKEN` unset in dev | `/api/metrics` is open until the env var is set; production should also keep it on an internal interface. |
| 22 | Dev database has no payment gateway keys | Nothing can be charged in dev: every provider reports `available: false` and checkout says so. That is correct behaviour, not a bug — set `PAYSTACK_SECRET_KEY` to exercise the flow. |

### Fixed in the end-to-end audit (2026-10-27, no action needed)

**An anonymous caller could enumerate invitation tokens.** `GET
/invites/product/:productId` and `/invites/room/:roomId` had no guard and
returned full invite rows — including the `token` and the invitee's email — for
any id, so anyone could pull a working credential for a private auction. Both
are now authenticated and scoped to the invite's creator (admins see all); a
listing with no viewer is refused rather than answered with every row.

**Two endpoints crashed for everyone.** `GET /admin/agents/dashboard` answered
500 because its metric aggregate selected `agent_metrics.totalExecutions`, a
column that does not exist; `GET /subscriptions/confirm` answered 500 when the
email link arrived without a token (`findOne({ token: undefined })`) and turned
an unknown token into a 500 too. Both now answer correctly, and the confirm
path returns 400 with a message.

**The buyer's account settings could not save anything and said it did.** Both
forms (`buyer/dashboard/modules/account.tsx`,
`buyer/dashboard/components/settings/settings_profile.tsx`) were pre-filled with
a fictitious customer's name, email and phone, posted field names the API does
not accept (`email`, `address_line1`, `city`, …), and — because `fetch` resolves
on a 400 and the catch block re-toasted success — reported "saved" every time.
The API also had no way to *read* the profile back, so nothing could populate
those fields honestly. `GET /auth/me` now returns the caller's own profile; both
screens load from it, save only `{name, phone}` and a composed `address`, and
surface the real error.

**An administrator could not open a private bidding room.** The
member-only check applied to admins too, so oversight of a private sale was
impossible (403). Admins may now read a private room and its participants, still
without seeing the join code.

**Category management had no admin view.** The admin category table was backed
by the public, active-only list, so a deactivated category disappeared from the
screen used to re-activate it, and `findAllAdmin()` was never wired to a route.
`GET /categories/admin/all` (guarded, declared before `:slug`) fixes both.

**Manually settling an invoice left no escrow hold.** `POST /invoices/:id/pay`
(the admin path for bank transfers and offline settlement) marked the invoice
paid but never opened the hold, while the payment webhook did — so a manually
settled sale credited the seller nothing on release, was invisible to the
auto-release sweep, and left the escrow screen empty. `markPaid` now opens the
hold inside the same transaction (idempotent: `holdInManager` returns null when
an open hold exists, and the partial unique index catches racers).
`/testdata` caught it; a verification now asserts the hold exists, that it
splits into seller + platform + VAT, and that re-settling does not double-hold.

**The publishing gate blamed the score for missing documents.** With KYC
verification approved and consent granted but no approved documents, approving a
lot answered "KYC compliance score 0% (high risk) does not meet the publishing
threshold" — pointing an admin at the score when the fix was to approve
documents. The gate now names the actual blocker (outstanding documents, a
blocking signal, or no configured requirements).

**Banner links could not point at localhost.** `@IsUrl()` rejects hostnames
without a public TLD, so a dev banner could not link to the local site; it now
uses `require_tld: false` and still rejects a genuinely invalid URL.

**The API contract disagreed with the code.** `POST /sellers/register` was
guarded but not marked `@ApiBearerAuth()`, so the generated client types
advertised it as public; approving a lot answered 403 without saying which
control clears the gate. Both corrected.

### Fixed in the payments / invoice / invitation pass (for context, no action needed)

**Checkout only offers providers that can actually settle (verified 52/52).**
`PAYMENT_PROVIDERS_DISABLED` (default `opay,interswitch`) removes a provider at
the server; a provider with no credentials is refused too, because creating a
payment for it left a PENDING row that pinned the invoice — the buyer could
never pay it, and a retry was answered with "already in progress". The checkout
page reads `available`/`configured` and names the reason it cannot offer a
method.

**Money is reported as three different things.** `GET /admin/kpi` sums stored
columns only: GMV (hammer value), platform revenue (`platform_share`, ex-VAT),
VAT (a liability), buyer-billed, receivable, escrow float and its seller/platform/
VAT split, in-flight payouts, and a control count of escrow holds whose
components do not add up. The admin dashboard labels each figure and shows no
mock numbers; the seller dashboard's cards come from `sellers/dashboard`,
`sellers/me/products` and `sellers/payouts/me` (`in_progress_count` is new).
The buyer's purchase detail renders the invoice's own line items instead of
recomputing a 19% premium.

**Invitations and private rooms work end to end (verified).** `GET
/invites/received` returns invitations addressed to the account, with the room
and the inviter; `POST /invites/validate` describes the room the link opens
(it returned a bare invite row, so the landing page treated every invitation as
invalid); `POST /rooms/:id/join` accepts an `inviteToken` and redeems it; a
request-mode invitation only admits the bidder after the seller approves, and
can no longer be self-approved through `POST /invites/respond`; the token must
match the room and, when the invite names an invitee, the account email.
`GET /rooms` is public-rooms-only, `GET /rooms/mine` gives a seller their own
rooms with join codes, `GET /rooms/:id` and `/:id/participants` refuse
non-members of a private room, and the admin report (`GET /admin/rooms`) still
sees every room. Seller room create sends `startTime`/`endTime`, posts through
the proxy and reports failure instead of showing a success dialog; the invite
dialog surfaces its error instead of fabricating a demo link.

## 2. Decisions already taken — do not reopen

| Decision | Chosen behaviour |
|---|---|
| Escrow economics | The hold stores the buyer's whole bill; the seller is credited **net**; the platform keeps its share; VAT belongs to neither party. Invariant: `sellerNet + platformShare + vatTotal === total`. |
| Fee policy | Platform commission is fixed by an **admin** (`buyerFeePct`, `sellerFeePct`, `vatPct`). A seller may only toggle whether each fee applies. |
| Final bid subject to seller approval | Optional per lot (`requiresSellerApproval` + `approvalThreshold`). Settlement parks the lot in `awaiting_seller_approval`; the seller accepts (invoice issued) or declines (lot closed). Unanswered lots expire after `SELLER_APPROVAL_WINDOW_HOURS` (default 72). |
| KYC vs publishing | KYC approval is **not** publishing consent. The compliance score/band is advisory; an admin makes the publish decision. Both are required before a lot can go public. |
| Multi-currency | **NGN-only checkout.** No FX at charge time; a non-NGN invoice is refused at payment init with an explanation. Display/rates may vary, settlement may not. |
| Provider availability | A provider is offered only when it is configured **and** not listed in `PAYMENT_PROVIDERS_DISABLED`. Taking money the platform cannot confirm is not an option. |
| Private rooms | `GET /rooms` lists public rooms only. A private room is readable and joinable only by its owner, its invited bidders, or a redeemed invitation token; a join code is a weaker credential the seller may also enable. |

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
unique indexes · cron advisory locks · the bid cooldown records its slot only
**after** the bid commits, so a rejected bid never locks the bidder out · escrow
holds and shipments are deliberately party-scoped (an admin gets 403) ·
`@IsUrl` and the enum values are consistent per module (documents are lowercase
`approved`, sellers uppercase `APPROVED`) · the bidding-room lifecycle cron
(`scheduled` → `live` → `closed` every minute, overlap-guarded, broadcasts over
the socket) — verified live, do not rewrite it.

---

## 4. Operating notes

**Environment (frontend).** `NEXT_PUBLIC_API_URL=/api/proxy`,
`API_URL=http://localhost:3001/api` (absolute; server-side only),
`AUTH_SECRET`, `NEXT_PUBLIC_REALTIME_URL=http://localhost:3001`.
See `frontend/.env.example`.

**Environment (backend).** `SELLER_APPROVAL_WINDOW_HOURS` (default 72),
`QUEUE_REQUIRED` (on by default in production), `PAYOUT_BANK_HOLD_HOURS`
(default 48; how long a changed payout account must rest),
`PAYMENT_PROVIDERS_DISABLED` (comma-separated; **set to `opay,interswitch`
until their webhook signatures are implemented**), `DB_*`, `JWT_SECRET`.
Optional: Redis (`REDIS_URL`) — without it settlement runs inline and
`settlement_queue_available` reports 0.

**Audit endpoint sweep.** `node tools/audit/probe-all.js` walks every route in the
live OpenAPI document with an anonymous, buyer, seller and admin token and
reports crashes, auth bypasses and guards that disagree with the spec; it exits
non-zero when it finds something. Run it after touching guards or DTOs: it is how
the crashed dashboard, the unscoped invite listings and the mismatched
`@ApiBearerAuth()` were caught. Needs a running API with Swagger enabled, so run
it against dev or staging.

**Verify before shipping.**
```
cd backend  && npm run build && npx jest && npm run lint   # 53 suites / 436 tests, 0 lint errors
cd frontend && npx tsc --noEmit && npm run lint && npm test && npm run build
```
CI runs the same steps on `main`; all three jobs (Backend, Frontend, Lighthouse)
are green. A migration baseline exists — run `npm run migration:run` after
pulling.

**Dev data touched by verification.** The following dev rows were changed while
proving behaviour and are safe to reset: the lot 2019 Toyota Hilux 2.4 GD-6
(356daaed…) was parked and then closed by the approval-expiry sweep;
phase1.seller@, phase4.buyer@ and wallet.probe.*@greyauction.dev are test
accounts; settings.email holds a dummy SMTP host whose password reads back
masked; several `verification:*` private rooms and their invitations/participants
were created by the invitation verification; the KYC requirement for
national_id has one submitted document.

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
OpenAI-compatible providers usable by agents, API keys masked) · ledger-backed
seller payouts (wallet drawdown, two-phase hold, server-side PIN, bank-change
rest) · provider allow-list, money KPIs and the invitation/private-room flows.

Each of those landed with tests and a live verification; `git log` has the
detail.

# Grey Auction — review & fix plan

**Living document. Last updated 2026-10-26.**

This file used to carry the full defect catalogue plus a pass-by-pass delivery
log. Completed work has been removed — **only pending work is listed below**.
The history is in git (`git log --oneline -- docs/review/FIX-PLAN.md`).

Every item here is something that is *not* done. If you fix one, delete it from
this file and describe it in the commit message instead.

---

## 1. Pending work

### P1 — blocked on a decision or an external input

| # | Item | Why it matters | Where | Next step |
|---|---|---|---|---|
| 1 | **Overpaid escrow holds** | Before the payout split existed, released holds were paid the buyer's gross amount (`sellerNet + platformShare + vat`). The migration corrected the stored figures; the money itself was already credited. | `backend/src/escrow/escrow.service.ts`, migration `1790000000000` | Business decision: absorb it, offset a future payout, or invoice the seller. If actioned, add an admin report listing holds released before the split date whose components do not reconcile. |
| 2 | **OPay webhook signature** | Cannot settle OPay payments. Fails *closed*, so nothing can be forged. | `backend/src/payments/providers/opay.provider.ts:26` | Confirm the signature header from OPay's docs, implement, and replay a sample payload in a test. |
| 3 | **Interswitch IPN signature** | Same as above for Interswitch. | `backend/src/payments/providers/interswitch.provider.ts:27` | Confirm the IPN signing scheme from Interswitch's docs, then implement + test. |
| 4 | **Bank-account name resolution** | The withdraw "add account" step saves what the user typed and says the number cannot be verified automatically. | `frontend/shared/components/add_account_steps/add_account_step.tsx` | Needs a name-enquiry provider (e.g. Paystack resolve-account) and a key. Wire it behind an env flag; keep the honest "unverified" wording when no key is configured. |

### P2 — real gaps worth building

| # | Item | Why it matters | Where | Next step |
|---|---|---|---|---|
| 5 | **No UI for lot documents** | `POST /products/:productId/documents` accepts a multipart upload and the lot page renders verified documents, but a seller has no way to upload one. | `frontend/app/[locale]/(domain)/seller/auctions/create_listing/` | Add an upload panel to the seller's lot editor (the KYC verification panel is the pattern to copy). |
| 6 | **KYC review does not notify the applicant** | An account holder must revisit the page to discover an approval or rejection. | `backend/src/kyc/kyc.service.ts` (`reviewDocument`) | Emit a notification after a review (approved / rejected + notes). `NotificationService` already has the helpers to model it on. |
| 7 | **`/api/metrics` is public** | Exposes business gauges (revenue, active users, bid counts) to anyone who can reach the API. | `backend/src/metrics/metrics.controller.ts` | Either bind it to an internal interface or require a scrape token (`METRICS_TOKEN`) when one is configured. |

### P3 — accepted, low value

| # | Item | Note |
|---|---|---|
| 8 | Chat has no typing or presence indicators | Messages deliver live over the `/chat` socket and are notified; typing/presence was never promised in the UI. |
| 9 | Agent monitoring is polled (15s), not pushed | Deliberate: the page says "Live (15s)" and can be paused. Move it to the existing socket gateway only if 15s proves too coarse. |

---

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

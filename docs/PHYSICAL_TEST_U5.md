# U5 Physical Test Runbook (updated 2026-09-02, after live E2E verification)

Manual test plan for the U5 fee-rules features. Dev servers must be running
(backend `:3001`, frontend `:3000`). Swagger: <http://localhost:3001/api/docs>.

## What is already covered automatically (2026-09-04 prep pass)

The physical pass below stays the source of truth for on-device UX, but the
following now run without a human:

- **Backend jest** covers the fee-resolution chain, escrow auto-hold and the
  buy-now endpoint contract (`npx jest` — includes the payments provider
  suites for OPay/Interswitch added 2026-09-04).
- **Frontend e2e** smokes the seller dashboard (overview/payment/bidding-room)
  and buyer dashboard (account + wallet module) with minted storageStates
  (`e2e/seller.spec.ts`, `e2e/buyer.spec.ts` — sessions minted in
  `auth.setup.ts`), plus the listing/a11y/responsive suites.
- The old manual setup steps that automation now covers: admin AI console
  reachability (`e2e/ai-admin.spec.ts` asserts the provider grid renders data
  on first paint) and the checkout invoiceId linkage (fixed, see Known gaps).
- Still manual: Phases 2-7 on real devices (webhook simulation needs the
  two-phase backend restart; escrow sweep timing is easiest to observe live).

Everything below was verified end-to-end in the dev environment on 2026-09-02
(buy-now → offline init → signed webhook → invoice paid → escrow hold →
auto-release → seller wallet credit).

## Accounts (dev DB)

| Role | Email | Password |
|---|---|---|
| Platform admin | admin@greyauction.com | Admin@12345 |
| Seller | demo@seller.com | Seller@12345 |
| Buyer | demo@buyer.com | Buyer@12345 |

Log in through the **frontend UI** so the Redux auth slice gets the bearer
token the islands use.

## Current baseline (before your edits)

- `fee_configs.default`: buyer fee **10%**, seller fee 5%, VAT 7.5%,
  VAT base `hammer_and_fees`. You will change the buyer fee to 5% yourself
  in Phase 1.
- One buyer override exists from the live E2E (demo buyer @ 2%). Delete or
  edit it in Phase 1 as you like.
- All sellers `payout_frequency = weekly`.
- Two U5 test lots from the E2E exist ("U5 Test Buy-Now Lot",
  "U5 Escrow Release Lot") — both already sold; harmless demo history.

## Fee resolution precedence (U5 #1)

    product → seller → buyer → category → platform default

The first layer that sets a field wins for that field; everything else keeps
falling through. A buyer-scoped override changes what THAT buyer pays on
every invoice (auction settlement and buy-now).

## Phase 1 — Admin: global fee config + overrides

1. Log in as `admin@greyauction.com` → **Admin → Settings → Fees**.
2. Edit the `default` configuration:
   - Buyer fee (commission): `5` → Save → re-open and confirm.
   - Seller commission (U5): `5`, VAT: `7.5`
   - VAT base (U5 switch): `Fees only` → Save → switch back to
     `Hammer + fees` → Save (test both).
3. **Fee Overrides card** — now supports three scopes: Seller, Product and
   **Buyer**. To get an id, use Swagger `GET /api/users/me` while logged in
   as that user, or copy from the users table.
   - SELLER override for demo@seller.com: buyer fee 3%, seller fee 4%,
     VAT empty (inherit).
   - PRODUCT override for a product id: buyer fee 7%, VAT base `Fees only`.
   - BUYER override for demo@buyer.com: buyer fee 2%.
4. Precedence check (optional, Swagger `GET /api/fees/breakdown?amount=1000`
   only resolves category/default): confirm at settlement time that a lot
   with both seller and buyer overrides shows `fee_source: seller` for the
   seller's fee fields... actually fee_source names the FIRST layer that
   contributed any field — product > seller > buyer.

Expected: overrides persist across reloads; the buyer override is used in
Phase 4/5 invoices.

## Phase 2 — Seller: create listing with U5 fields

1. Log in as `demo@seller.com` → **Seller → Create Listing**.
2. Step 3 (Pricing & Terms):
   - Starting price `1000`, reserve `1500` (hidden), buy-now `5000`
   - **Minimum Bid Increment (U5)**: `500`
   - **Escrow Release Window (U5)**: `0` (immediate) for this listing;
     a second listing with the default `72` later.
3. Publish. The lot starts as DRAFT.
4. **Direct-sale lots**: the UI has no auction-type switch yet, so approve
   the lot with the type via Swagger:
   `POST /api/products/{id}/approve` body `{ "auctionType": "direct_sale" }`
   as admin (or leave it open-auction and only test bidding). The type is
   locked at approval.

Expected: success (no 404 — the old publish bug), product has
`minBidIncrement: 500`, `escrowReleaseHours: 0`.

## Phase 3 — Seller: self-service fees + payout schedule

1. Still as the seller → **Seller → Settings → Fees & Payouts**.
2. The seller override from Phase 1 should prefill (buyer 3%, seller 4%).
3. Change buyer fee to `4`, toggle seller commission Off, Save.
4. **Payout schedule**: switch to `daily`, Save, then back to `weekly`.
5. Verify via Swagger `GET /api/sellers/settings/fees` and
   `GET /api/sellers/profile/me` (`payout_frequency`).

## Phase 4 — Buyer: bids + increment enforcement

1. Log in as `demo@buyer.com`, open the (open-auction) listing from Phase 2.
2. Bid `1200` on a current bid of `1000` (increment 500).

Expected: rejection — **"Minimum bid increment is 500 — bid at least 1500"**.

3. Bid `1500` — accepted; auto-bid ceilings step by 500 too.

## Phase 5 — Buyer: buy-now direct sale

1. Open the direct-sale lot from Phase 2.
2. Click **Buy Now**.

Expected: toast "Purchase started", redirect to `/checkout/payment`; order +
fee-bearing invoice exist. The invoice's buyer fee comes from the override
chain — with the buyer override @ 2% and default 10%, a ₦5000 hammer shows
**₦100** buyer fee and VAT **7.5% × (5000+100) = ₦382.50**
(`fee_source: buyer`). A second buyer gets "Another buyer already started
this purchase".

## Phase 6 — Payment + simulated webhook (verified flow)

Uses the local HMAC simulator — no real card, no Paystack call. The backend
must run in TWO phases because offline init requires the Paystack key blank,
while webhook verification requires a known key.

**Phase 6a — offline init** (ask the assistant, or run yourself):

    cd backend
    powershell -ExecutionPolicy Bypass -File scripts\payment-test-phase.ps1 -Phase offline
    # then RESTART the dev backend

Then as buyer (Swagger, authorized):

1. `POST /api/orders/buy-now/{productId}` → note `invoiceId`.
2. `GET /api/invoices/{invoiceId}` → note `total`.
3. `POST /api/payments/init` body
   `{ "type": "invoice", "provider": "paystack", "amount": <total>, "invoiceId": "<id>" }`
   → message "Paystack not configured" (expected); grab the payment
   **reference** from the response `data.reference`.

**Phase 6b — armed webhook** (ask the assistant, or run yourself):

    powershell -ExecutionPolicy Bypass -File scripts\payment-test-phase.ps1 -Phase armed
    # then RESTART the dev backend

Then fire the simulator from `backend/`:

    node scripts/sim-paystack-webhook.mjs --ref <reference> --amount <total>

Expected: `{ success: true, payment: { status: "succeeded" } }`. The invoice
flips to `paid`, the order to `paid`, and the escrow hold is created
atomically. Re-running the same command is a no-op (idempotent).

**Restore afterwards** (ask the assistant, or run yourself):

    powershell -ExecutionPolicy Bypass -File scripts\payment-test-phase.ps1 -Phase restore
    # then RESTART the dev backend (back to the real Paystack key)

## Phase 7 — Escrow auto-release (verified live)

The hold is placed automatically the moment the webhook marks the invoice
paid — no manual step. `auto_release_at` = paid_at + escrowReleaseHours.

- Listing with `escrowReleaseHours = 0`: the hold shows `held` with
  `auto_release_at = paid_at`; the next 5-minute sweep releases it —
  hold `released` and seller wallet credited
  (wallet transaction type `escrow_release`, reference
  `escrow_auto_release:<holdId>`).
- Listing with `72`: nothing releases for 72h (verify the timestamp).
- Dispute/refund flows are available in Swagger `POST /api/escrow/{id}/dispute`,
  `.../refund` (admin) if you want to test the L5 state machine.

## Known gaps / notes

- ~~Per-buyer fee override~~ — **implemented** (buyer scope, admin-managed).
- The create-listing UI has no direct-sale/open-auction switch — set the
  type at approval via Swagger (Phase 2 step 4).
- ~~Checkout "Payment Method" page does not pass `invoiceId` to
  `/payments/init`~~ — **fixed 2026-09-04**: the checkout payment form now
  forwards the buy-now invoice id (persisted in sessionStorage by the
  product page) so webhook success links straight to the invoice. Phase 6
  can use either the UI or Swagger init.
- Email sending fails harmlessly in dev (no Brevo SMTP) — ignore the logs.

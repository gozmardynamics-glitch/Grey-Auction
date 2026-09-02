# U5 Physical Test Runbook (2026-09-02)

Manual test plan for the U5 fee-rules features. Dev servers must be running
(backend `:3001`, frontend `:3000`). Swagger: <http://localhost:3001/api/docs>.

## Accounts (dev DB)

| Role | Email | Password |
|---|---|---|
| Platform admin | admin@greyauction.com | Admin@12345 |
| Seller | demo@seller.com | Seller@12345 |
| Buyer | demo@buyer.com | Buyer@12345 |

NOTE: log in through the **frontend UI** so the Redux auth slice gets the
bearer token the islands use.

## Current baseline (before your edits)

- `fee_configs.default`: buyer fee **10%**, seller fee 5%, VAT 7.5%,
  VAT base `hammer_and_fees`. You will change the buyer fee to 5% yourself
  in Phase 1.
- No `fee_overrides` rows. All sellers `payout_frequency = weekly`.

## Phase 1 — Admin: global fee config (U5 #1/#2)

1. Log in as `admin@greyauction.com` → **Admin → Settings → Fees**.
2. Edit the `default` configuration:
   - Buyer fee (commission): `5`
   - Seller commission (U5): `5`
   - VAT: `7.5`
   - VAT base (U5 switch): `Fees only` → Save → then switch back to
     `Hammer + fees` → Save (test both).
3. Re-open the module and confirm values persisted.
4. **Fee Overrides card** (same page): create a SELLER override for
   demo@seller.com's user id (get it via Swagger `GET /api/users/me` while
   logged in as the seller, or copy from the sellers admin table):
   buyer fee 3%, seller fee 4%, leave VAT empty (inherit).
5. Create a PRODUCT override for a specific product id: buyer fee 7%,
   VAT base `Fees only`.

Expected: overrides list renders with scope badge + rates; values persist
after reload.

## Phase 2 — Seller: create listing with U5 fields (U5 #4/#5)

1. Log in as `demo@seller.com` → **Seller → Create Listing**.
2. Step 3 (Pricing & Terms):
   - Starting price `1000`
   - **Minimum Bid Increment (U5)**: `500`
   - **Escrow Release Window (U5)**: set `0` (immediate) for one listing;
     create a second listing later with the default `72`.
   - Reserve price: tick, `1500`, visibility `hidden`
   - Buy now: tick, `5000`
3. Publish.

Expected: success (no "Failed to publish" — that was the old 404 bug),
product appears in Swagger `GET /api/products` with `minBidIncrement: 500`,
`escrowReleaseHours: 0`, reserve + buy-now values stored.

## Phase 3 — Seller: self-service fees + payout schedule (U5 #1/#3)

1. Still as the seller → **Seller → Settings → Fees & Payouts**.
2. The seller override from Phase 1 should prefill (buyer 3%, seller 4%,
   VAT base `fees_only`).
3. Change buyer fee to `4`, toggle seller commission Off, Save.
4. **Payout schedule**: switch to `daily`, Save.
5. Re-check Swagger `GET /api/sellers/settings/fees` and
   `GET /api/sellers/profile/me` — confirm `payout_frequency: daily`.
6. Restore: set payout back to `weekly` and seller commission On when done.

## Phase 4 — Buyer: bids + increment enforcement (U5 #5)

1. Log in as `demo@buyer.com`, open the listing created in Phase 2.
2. Try to bid `1200` on a current bid of `1000` (increment 500).

Expected: rejection — **"Minimum bid increment is 500 — bid at least 1500"**
(the old behavior would have accepted 1200).

3. Bid `1500` — accepted; auto-bid ceilings should also step by 500.

## Phase 5 — Buyer: buy-now direct sale (U5 #7)

1. Open a listing with Buy Now enabled (auction type direct sale).
2. Click **Buy Now**.

Expected: toast "Purchase started", redirect to `/checkout/payment`; the
order + **fee-bearing invoice** exist (check Swagger `GET /api/invoices` —
hammer price = buy-now price, buyer fee, VAT, `fee_source` shows the
override layer used). A second buyer clicking Buy Now on the same lot gets
"Another buyer already started this purchase".

## Phase 6 — Payment + simulated webhook (U5 #4 setup)

The checkout UI cannot reach the real Paystack sandbox reliably, so we run
the proven two-phase flow (same as the integration suite):

1. **Phase 6a (offline init):** ask the assistant to temporarily disable
   `PAYSTACK_SECRET_KEY` in `backend/.env` and restart the backend.
2. As buyer: `POST /api/payments/init` (Swagger, authorized as buyer):
   `{ "type": "invoice", "provider": "paystack", "amount": <invoice total>, "invoiceId": "<id>" }`
   → response contains the payment **reference** (message says not
   configured — that is expected). Copy the reference.
3. **Phase 6b (armed webhook):** ask the assistant to set
   `PAYSTACK_SECRET_KEY=itest-secret-key-123` and restart the backend.
4. Run the simulator:
   ```
   cd backend
   node scripts/sim-paystack-webhook.mjs --ref <reference> --amount <invoice total>
   ```

Expected: `{ success: true, payment: { status: "succeeded" } }`; the invoice
flips to `paid` and the order to `paid`. Re-running the same command is a
no-op (idempotency).

## Phase 7 — Escrow auto-release (U5 #4)

- Listing with `escrowReleaseHours = 0`: after Phase 6 the hold releases on
  the next 5-minute sweep — seller wallet is credited with reference
  `escrow_auto_release:<holdId>`, hold status `released`.
- Listing with `72`: `auto_release_at` = paid_at + 72h; nothing releases
  before then (verify via Swagger `GET /api/escrow/holds` or DB query).
- Verify sweep activity in backend console (EscrowAutoReleaseService logs).

## Known gaps / decisions

- **Per-BUYER-account fee override is NOT implemented** — U5 scope was
  seller + product scopes. Ask the assistant if buyer-scope overrides are
  wanted (new scope enum value + resolution layer + UI).
- Checkout "Payment Method" page does not pass `invoiceId` to
  `/payments/init` (pre-existing); Phase 6 uses Swagger init with the
  invoice id directly.
- Email sending fails harmlessly in dev (no Brevo SMTP) — ignore the log
  errors.

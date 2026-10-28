# testdata — throwaway fixtures for the whole app

Fills every section of the running app with labelled test data, so the screens
can be reviewed without a production database or real uploads.

**Nothing here is imported by the app.** Delete the folder and the app is exactly
as it was.

```bash
node testdata/generate-images.js   # 32 images + 2 PDFs (sharp / pdfkit, no network)
node testdata/seed.js              # writes everything through the API
node testdata/purge.js             # removes every row and file it created
```

`purge.js` also deletes the generated files and `manifest.json`. If you would
rather wipe the whole kit at once: `node testdata/purge.js && rm -rf testdata`.

Re-running `seed.js` without purging is safe: records that already exist are
adopted (categories answer 409 and are re-registered in the manifest) rather than
duplicated.

## Safety

Both scripts refuse to run when `NODE_ENV=production`, and `seed.js` refuses any
`TESTFILL_API` that is not `localhost`/`127.0.0.1`. Everything it creates is
recorded in `manifest.json`, and purge deletes by that recorded id — never by
name prefix — inside a single transaction, so a real row that happens to share a
word with the fixtures cannot be caught.

## What it fills

| Section | What appears | How |
|---|---|---|
| Categories | 6 categories with slugs + descriptions | `POST /categories` |
| KYC | one approved identity document for the seller, verification + publish consent | `POST /kyc/documents` → `…/review` → `POST /sellers/:id/approve` → `POST /admin/kyc/sellers/:id/publish` |
| Lots | **8 lots**, 3 images each, every field populated: subcategory, tags, specifications, reserve (with visibility), buy-now, bid increment, escrow window, seller-approval threshold, condition-report PDF | `POST /products` + `POST /products/:id/documents` + `POST /products/:id/approve` |
| Bids | 9 bids across 3 live lots, including one auto-bid ceiling | `POST /auctions/:id/bids` |
| Bidding rooms | 3 rooms (2 private, 1 public) + an exclusive invite the buyer redeems + a request-mode invite the seller approves | `POST /rooms`, `/invites/generate`, `/rooms/:id/join`, `/invites/approve/:id` |
| Invoices & escrow | 3 invoices: one outstanding, one paid→released, one paid→refunded | `POST /invoices`, `/escrow/holds`, `…/release`, `…/refund`, `/invoices/:id/pay` |
| Reviews | a 5★ seller review with the per-criterion ratings | `POST /sellers/:id/reviews` |
| Disputes | one dispute, moved to `UNDER_REVIEW` | `POST /disputes`, `PATCH /disputes/:id/status` |
| Support | 2 tickets with an admin reply | `POST /tickets`, `/tickets/:id/messages` |
| Shipping | delivery address + a shipment against the paid invoice | `POST /shipping/addresses`, `/shipping/shipments` |
| Watchlist | buyer watching 3 lots | `POST /watchlist/:productId` |
| Editorial | 3 FAQs, 3 hero banners, 2 content pages | `POST /admin/faqs`, `/admin/banners`, `PUT /content/:slug` |
| Agent studio | one tool, one instance, one workflow | `POST /admin/agents/*` |

62 records in total. Each section reports created / failed with the API's own
message, so a contract change shows up as a precise error rather than silence.

## Where the content comes from

* **Images** are generated locally by `generate-images.js` — gradients, labels and
  a "Test data — not a real listing" stamp, rendered by sharp (SVG) and pdfkit
  (PDFs). No downloads, no licensing questions, and every image is obviously a
  fixture in a screenshot.
* **Copy** (titles, descriptions, specifications) is written by hand in
  `seed.js` and deliberately plausible for an auction house.
* If you want photographic realism later, swap `testdata/images/*.webp` for real
  photos from Unsplash/Pexels (check each licence) — the seeder only cares about
  the filenames.

There is **no image-upload endpoint** in the API: `CreateProductDto.images` takes
URLs. So `seed.js` copies the generated files into `frontend/public/testdata/`
and references them as `/testdata/….webp`. That copy is removed by `purge.js`.

## Gotchas this kit encodes (useful when writing your own scripts)

* **The KYC gate blocks publishing.** `POST /products/:id/approve` answers 403
  until the seller's documents are *approved* **and** an admin grants publishing
  consent, so the seeder walks that chain first. Without it every lot stays a
  draft and the bid engine answers "Auction is not open for bidding".
* **Bids have a 2 s per-user-per-lot cooldown** — rapid bids are refused by
  design, so the seeder paces them.
* **An escrow hold can only be opened while the invoice is still `issued`**;
  `POST /escrow/holds` after `POST /invoices/:id/pay` answers "Invoice is not
  payable". Settling an invoice now opens its hold automatically, so the seeder's
  explicit hold is only there to get a hold id it can release/refund — the
  idempotent insert makes the second attempt a no-op.
* **Holds and shipments are party-scoped** — the buyer opens the hold and books
  the shipment; an admin token gets "This invoice does not belong to you", and
  `GET /escrow/holds/invoice/:id` filters to the caller, so a verification script
  must read it as the buyer.
* **Enums are lowercase** in some places (`KycDocumentStatus='approved'`) and
  uppercase in others (`documentType='INSPECTION_REPORT'`). The API's validation
  message names the allowed values, which is the fastest way to find out.
* **`@IsUrl()` rejects localhost**, so banner links need a public-looking URL.
* Multipart uploads must carry a real MIME type — `new Blob([buffer])` defaults
  to `application/octet-stream`, which the storage allow-list refuses.

## Which accounts it uses

Defaults (override with `TESTFILL_*` env vars):

| Role | Email | Password |
|---|---|---|
| admin | `admin@greyauction.com` | `Admin@12345` |
| seller | `phase1.seller@greyauction.dev` | `Phase1@12345` |
| buyer | `phase4.buyer@greyauction.dev` | `Phase4@12345` |

It never creates users, so no email is sent and the registration throttle is not
touched. KYC and lot documents *are* uploaded, which writes real objects through
the configured storage driver (`local` in dev, R2 in production).

## Not covered

* **Payments through a gateway** — no provider keys in dev, and the app refuses
  unconfigured providers by design. Invoices are settled with the admin
  `POST /invoices/:id/pay` route instead.
* **Wallet top-ups / payout requests** — they need a payment or an approved
  seller payout; the payout flow is verified separately in
  `docs/review/FIX-PLAN.md`.
* **Newsletter subscriptions** — `POST /subscriptions` sends an opt-in email.
* **Advisors** — there is no create endpoint, so that list stays empty.
* **Settings sections** — `PUT /settings/:section` has a section-specific payload;
  not seeded deliberately, since a wrong shape would change platform behaviour.

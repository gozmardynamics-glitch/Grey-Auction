# FAQ section — design, content and open decisions

**Written 2026-10-28.** Content lives in [`content/faqs.json`](../../content/faqs.json)
(74 answers, 9 topics); this document explains the design, maps each topic to the
part of the app it describes, and lists the policy questions I could not answer
from the code.

Load or refresh it with:

```bash
node tools/faq/load-faqs.js            # create/update
node tools/faq/load-faqs.js --dry-run  # preview
node tools/faq/load-faqs.js --reset    # remove only the entries this file owns
```

It goes through the admin API, so the public page and the admin console stay in
step. Identity is the question text — re-running updates in place, never
duplicates.

---

## 1. What the section is

The FAQ is organised by **what the reader is trying to do**, not by how the
software is built. Three audience tabs sit over nine topics:

| Tab | Topics |
|---|---|
| **Everything** | all nine |
| **Buying** | Buying and bidding · Paying and invoices · Collecting your lot |
| **Selling** | Selling with GreyAuction · Fees and payouts |
| **Both** (always shown) | Getting started · Private rooms and invitations · Verification and account · Disputes, refunds and rules |

| Topic | Answers | Covers |
|---|---|---|
| Getting started | 7 | what the platform is, accounts, currencies, phones, contacting a human |
| Buying and bidding | 13 | placing bids, auto-bid and precedence, rejection reasons, increments, reserve, Buy Now, what happens at close, seller approval, watchlist, self-bidding |
| Paying and invoices | 11 | total composition, premium, VAT, paying, available methods, deadlines, instalments, finding invoices, third-party payers, missing payments, invoice amendments |
| Collecting your lot | 6 | when collection opens, delivery, third-party collection, condition reports, viewing, escrow while collecting |
| Selling with GreyAuction | 10 | becoming a seller, the publish gate, what to list, reserve/Buy Now/increment/escrow window, seller approval of the final bid, locked terms, unsold lots, prohibited items, inviting buyers |
| Fees and payouts | 7 | seller fees, when you get paid, balance vs sale price, requesting a payout, the bank-change hold, payout frequency, failed payouts |
| Private rooms and invitations | 6 | what a private room is, joining, request-mode, forwarding invitations, lost invitations, deposits |
| Verification and account | 7 | buyer vs seller verification, document requirements, review time, password reset, profile edits, deletion, suspension |
| Disputes, refunds and rules | 7 | opening a dispute, what happens next, refunds, bid enforceability, condition rules, reviews, data use |

Every answer is checked against the code — the fee lines, the 2-second bid
cooldown, the escrow window, the 48-hour bank-change rest, the publish gate, the
invitation token rules. Where the app has a configurable value the answer says
"shown on the lot page" or "set by the seller" rather than printing a number that
would go stale.

## 2. Design decisions

**Search over 74 answers, not over categories.** Placeholder states the count so
someone knows searching is worth it. Search covers question *and* answer text.

**Tabs before topics.** A seller hunting payout timing should not have to read
bidding rules to get there. Tabs are additive: "both" topics stay visible in
either tab, so nothing disappears.

**Chips filter rather than decorate.** Previously the category pills were
non-interactive labels — decoration that looks like a control. They now filter,
show their own counts, and clear.

**Answers are written in two short paragraphs.** First paragraph answers the
question; second says what to do about it ("check again shortly", "tell support
before paying"). Long answers are the exception, not the format.

**Every answer has an anchor and a copy-link button.** `/en/faq#why-was-my-bid-rejected`
opens the page, reveals the right tab and scrolls to the answer — so a support
reply can point at one paragraph instead of pasting it. Deep-linking from the app
screens is the next step; see §5.

**The page ends with two routes out**: contact support (opens a ticket, which
lands in the dashboard) and browse auctions. It also says plainly that the Terms
and Conditions are the binding agreement — an FAQ that implies legal force is a
liability.

**Answers are machine-readable, not just visible.** The accordion keeps closed
panels out of the HTML, which would hide every answer from search engines, so the
page also emits `FAQPage` structured data built from the same content — 74
questions, each with its answer as a single string. That is what makes these
answers eligible for rich results, and it costs no extra maintenance because it is
derived.

**Deliberately not claimed.** The content avoids promising numbers or timelines
the product does not enforce: no refund SLA, no collection hours, no storage fees,
no instalment options, no "bids may be withdrawn". Each of those is a policy
decision listed in §4.

## 3. What it changed in the app

| File | Change |
|---|---|
| `content/faqs.json` | the content itself, one source of truth |
| `tools/faq/load-faqs.js` | idempotent loader over the admin API, `--reset` scoped to its own questions |
| `frontend/lib/server/data.ts` | `getFaqCategories()` now respects the `order` column, orders topics by their first entry, and attaches a slug per question (it previously ignored `order` entirely and invented emoji by position) |
| `frontend/app/[locale]/(website)/_islands/searchable_faq.tsx` | audience tabs, working category filter with counts, match counter, multi-paragraph rendering, per-answer anchors + copy-link, support CTA, terms disclaimer |
| `frontend/app/[locale]/(website)/faq/page.tsx` | `FAQPage` structured data (74 questions) + a one-line purpose statement under the heading, since an accordion hides answers from crawlers |
| `frontend/app/[locale]/(website)/models/index.ts` | `FAQItem.id` (optional anchor) |
| `testdata/seed.js` | fixture FAQs moved into a single `TESTFILL fixtures` category so they can never appear as real topics on the public page |

Verified in the running app: `/en/faq` returns 200 with all nine topics, the tabs,
the answer count and a deep-linked answer; the public API serves 74 active rows.

## 4. Areas that need a decision

These are the questions I could not answer from the code. Each is a **policy**
call, not a bug — and each currently has an answer written to avoid inventing
one. Ordered by how much it affects trust.

| # | Question | Why it matters | What I recommend | Where the code stands |
|---|---|---|---|---|
| 1 | **What fees exactly?** Buyer's premium %, seller commission %, and whether they vary by category | Buyers compare totals; sellers compare net proceeds. Vagueness reads as concealment | Publish a fee schedule page and link it from every lot; keep per-category overrides visible on the lot page | `fees` table already holds `commissionPct` (10), `sellerCommissionPct` (5), `vatPct` (7.5), `otherChargesPct` per category — the numbers exist, they are just not published |
| 2 | **VAT base** — on hammer only, or hammer + premium? | Changes every total by ~0.75% of hammer; buyers notice | Confirm the treatment you want to defend to FIRS, then set `vat_base` accordingly and state it in the FAQ | `vat_base` is stored per invoice (`hammer_and_fees` default) and shown nowhere in the UI |
| 3 | **Invoice payment deadline** and what happens on breach | Currently a seller-level setting with no platform default and **no automatic consequence** | Platform default of 7 days; on breach: cancel invoice, relist the lot, and record it on the buyer's account | `seller.invoice_payment_due_days` exists; nothing acts on overdue invoices |
| 4 | **Refunds: partial or full only?** | Disputes over "not as described" often settle at a partial refund | Allow full refund now (implemented) and say so; add partial refunds only if you will support them operationally | `POST /escrow/holds/:id/refund` refunds the whole hold |
| 5 | **Dispute resolution SLA** | The FAQ currently promises nothing, which is honest but weak | Commit to a first response (e.g. 3 business days) and an outcome target (e.g. 10) | No SLA field; disputes have status only |
| 6 | **Collection windows, storage fees, non-collection** | Lots paid for and never collected are a real cost | State a collection window per lot and a storage fee after it — both need a field on the lot | Not modelled at all |
| 7 | **Transit risk and insurance** | "Who pays if the transporter damages it" is the first question after a car sale | Decide whether the platform arranges insurance or explicitly disclaims it; say which | Shipment records carrier + cost only |
| 8 | **Payment methods at launch** | The FAQ says "only what checkout shows", which is truthful but unhelpful before launch | Confirm the launch set (currently Paystack; OPay and Interswitch are switched off until their webhooks verify) | `PAYMENT_PROVIDERS_DISABLED=opay,interswitch` |
| 9 | **Export licences for antiquities** | Benin bronzes and similar cannot legally leave Nigeria without a licence; the FAQ hints at it | Require an export licence document type on antiquity categories before bidding is allowed | Lot specifications have an `Export` free-text field; no licence document type, no gate |
| 10 | **Deposits in private rooms** | `requiresDeposit`/`depositAmount` exist but forfeiture terms do not | State when a deposit is forfeited (e.g. non-payment after win) before charging any | Deposit is checked at join/bid; nothing consumes it |
| 11 | **Do buyers need KYC above a threshold?** | High-value lots attract fake bidders | Consider requiring verification for bids above a set value | Only sellers have KYC; buyers need a verified email |
| 12 | **Third-party payments** | Currently unenforced, so the invoice can be paid by anyone with the reference | Decide: allow with a note, or refuse | Buyer-scoped invoice, but nothing stops a transfer from another name |
| 13 | **Data retention after account deletion** | The FAQ says records are retained; it does not say for how long | Align with your accounting retention obligation (typically 6–7 years for invoices) | Soft delete (`isActive=false`), nothing purges |
| 14 | **Seller-to-seller bidding** | Undecided; it looks like shill bidding to an observer | Decide and enforce explicitly rather than leaving it ambiguous | Bidding engine blocks self-bidding only |

Two smaller inconsistencies worth a line each in the FAQ once decided:

- **`CreateProductDto.auctionType` is accepted but ignored** — the type is fixed at admin approval. The FAQ explains the effect ("approved as a direct sale") without exposing the field.
- **Currency display is indicative only.** Exchange rates are seeded and refresh daily, but nothing in the checkout converts. Saying "indicative" once is cheaper than explaining a rate mismatch later.

## 5. Suggestions beyond the page itself

1. **Deep-link from the screens that raise the question.** Highest-value three:
   - lot page fee line → `#how-is-my-total-calculated`
   - seller payment screen → `#why-cant-i-withdraw-after-changing-my-bank-details`
   - verification panel → `#why-cant-i-publish-my-lot`
   The anchors already exist; this is a link, not new content.
2. **Put the same search on the Contact page.** Answering before the ticket is
   cheaper than answering after it, and the component is already built.
3. **Log zero-result searches.** "What do I do if I cannot pay in time" with no
   result is the next answer to write; without logging, that signal is lost.
4. **Translate the content when the page is localised.** `fr` and `nl` message
   files exist but FAQ copy is English-only, so a French visitor gets a
   translated shell around English answers. The JSON is structured for it — one
   file per locale would do.
5. **Give the admin table a reorder control.** `order` now drives reading order
   on the public page, so it is a real editorial setting, not a hidden field.
6. **Keep the FAQ and the Terms distinct.** Anything about liability, payment
   obligations or forfeiture belongs in the Terms, with the FAQ linking to it —
   that is why the page closes with the binding-agreement line.

## 6. Maintaining it

- Edit `content/faqs.json`, run `node tools/faq/load-faqs.js`. Do not edit rows in
  both places — the file is the source of truth for these 74 questions.
- Answers added in the admin console are untouched by `--reset`; only questions
  present in the file are managed by it.
- If a question is reworded in the file, it is treated as a **new** entry: the old
  row stays until deleted by hand. Reword only when you intend that.

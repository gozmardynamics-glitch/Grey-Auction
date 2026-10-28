# Complaints management — design

**Written 2026-10-28.** Public policy: `/complaints` (`content/legal/complaints-policy.md`).
This document is the internal half: how a complaint travels through the platform,
what the app already supports, and what is missing before the published
timeframes can actually be met.

Modelled on the structure of Grays' Complaints Management Policy (policy,
principles, how to lodge, what we will do, assistance, escalation, complainant
responsibilities, rights), rewritten for this platform's mechanics — escrow,
disputes, the ticket queue — and for Nigerian external escalation (FCCPC, NDPC,
the courts) rather than Australian state fair-trading bodies.

---

## 1. The problem this solves

The platform already had three complaint-shaped channels and **no way to tell
them apart**:

| Channel | Entity | What it is for | Who can see it |
|---|---|---|---|
| Support ticket | `tickets` | questions, enquiries, anything raised in writing | the account holder and admins |
| Transaction dispute | `disputes` (trust module) | "this purchase went wrong" — freezes escrow | the two parties and admins |
| Review flag | `seller_reviews.flag_reason` | an abusive or false review | admins |

Two consequences, both real:

1. **Nothing was classified.** The contact form sent a fixed subject —
   `Website enquiry from <name>` — so a complaint about a withheld payout and a
   question about opening hours arrived looking identical. Triage was by reading
   every message.
2. **No commitment was recorded anywhere.** There was no acknowledgement clock, no
   reference number surfaced to the user, no escalation tier, and no outcome
   taxonomy — so no way to answer "how many complaints did we get, how fast did we
   answer, and what did we do about them".

## 2. What was built now

- **`/complaints`** — a published policy covering the definition of a complaint,
  the agency relationship (we are agent, the seller owns the lot), the channel per
  problem type, acknowledgement in 2 business days, resolution targets, internal
  review, external escalation to the FCCPC / NDPC / courts, the complainant's
  responsibilities, and the fact that complaining costs nothing and never
  penalises an account.
- **A triage topic on the contact form** — nine topics matching the taxonomy
  below. The topic is written into the ticket **subject** as `[Topic] Name`,
  because `Ticket` has no category column and the subject is the only field the
  queue surfaces. `topic` itself is *not* posted: `ContactDto` is
  whitelist-strict, so an extra key would have been rejected with a 400.
- **Cross-links** from the policy to the dispute route, the data-protection route
  and the data-protection officer, so the reader is sent to the right machinery
  instead of a general inbox.

## 3. Taxonomy

Nine topics, chosen so each maps onto an existing record that already holds the
evidence:

| # | Topic | Typical complaint | Evidence the app already has | Handled as |
|---|---|---|---|---|
| 1 | Bidding and auctions | bid rejected, auto-bid lost, lot closed early, reserve behaviour | bid log, lot terms, cooldown and increment rules | ticket |
| 2 | Payments and invoices | card declined, charged twice, invoice total queried | `payments`, invoice line items, provider reference | ticket |
| 3 | Escrow, refunds and disputes | money still held, refund not received, dispute outcome | `escrow_holds` split, dispute record | **dispute** (freezes funds) |
| 4 | Seller payouts | payout delayed or failed, bank change blocked | wallet ledger, payout rows, `bank_changed_at` rest window | ticket |
| 5 | Listing accuracy and condition | item not as described, missing accessory | lot description, uploaded condition report | **dispute** if purchased; ticket if pre-bid |
| 6 | Delivery and collection | late, damaged in transit, wrong address | shipments, address record | ticket |
| 7 | Account, verification and access | KYC rejected, cannot sign in, suspended | KYC documents + reviewer note, account status | ticket |
| 8 | Data protection and privacy | "what do you hold, delete it" | — (statutory route) | **DPO / NDPC route** |
| 9 | Something else | anything unclassified | — | ticket, then routed |

The distinction that matters most: **anything about money already paid or held
must be a dispute, not a ticket**, because only a dispute flags the escrow hold.
The policy says this in the first row of its channel table, and the contact form
repeats it under the topic select.

## 4. Lifecycle and service levels

Current statuses the app can express:

```
TICKET    open ──▶ in_progress ──▶ resolved ──▶ closed
DISPUTE   open ──▶ under_review ──▶ resolved
                                └─▶ rejected
```

Mapped to the published policy:

| Stage | Published commitment | Machine state today |
|---|---|---|
| Acknowledgement + reference | within **2 business days** | ❌ nothing; the ticket id exists but is never sent to the user, and no clock runs |
| First response | within **2 business days** | ❌ no timestamp for "first agent reply" |
| Resolution | **10 business days** typical, **20** with a third party | ❌ no due date on the ticket |
| Updates if slipping | before the deadline | ❌ no slip detection |
| Dispute freezes funds | immediately | ✅ opening a dispute flags the escrow hold |
| Outcome communicated with reasons | always | ⚠️ disputes have `resolution`; tickets do not |

## 5. Severity — the missing dimension

Not every complaint can have the same clock. Proposed tiers, to be stored on the
complaint record (currently nowhere):

| Tier | Examples | Acknowledge | Resolve |
|---|---|---|---|
| **P1 – funds or safety** | money held wrongly, payout sent to the wrong account, fraudulent seller, threat | same business day | 5 business days |
| **P2 – sale failure** | non-delivery, materially not as described, duplicate charge | 1 business day | 10 business days |
| **P3 – service failure** | slow response, unclear fee, delivery delay | 2 business days | 15 business days |
| **P4 – feedback** | suggestion, praise, general question | 2 business days | 20 business days (or no reply needed beyond the answer) |

The published policy states the P2/P3 range deliberately; it does not promise P1
timings in public, because a same-day commitment is an operations promise that
depends on cover.

## 6. Escalation ladder

Modelled on Grays §7, adapted:

1. **First-line agent** — resolves at first contact where possible; owns the
   reference and the user's name.
2. **Internal review** — request by replying to the same reference. Different
   person, senior. Finance lead for payment/escrow/payout; head of operations for
   conduct and seller behaviour. Never the person who decided first.
3. **External** — FCCPC (consumer), NDPC (personal data), the courts or an ADR
   centre such as the Lagos Multi-Door Courthouse, or the complainant's bank for a
   card transaction.

**Separation of duties** is a control, not a courtesy: in a marketplace where
staff can release escrow, no one should be able to decide a complaint about their
own payout decision. That is why the finance lead reviews payment escalations
rather than the ops team.

## 7. Remedies available

The platform can already do these; the policy should only promise what they can
deliver:

| Remedy | Mechanism |
|---|---|
| Explanation or correction | ticket reply |
| Apology | ticket reply |
| Full refund of a purchase | refund the escrow hold — unwinds the sale |
| Partial refund | **not implemented**: the escrow refund is all-or-nothing |
| Fee waiver or credit | needs a wallet credit entry — no admin endpoint today |
| Re-delivery / reshipment | new shipment on the same invoice |
| Seller action (warning, suspension, delisting) | admin seller status and lot moderation |
| Account action | suspend or activate via admin |

## 8. Roles

| Role | Responsibility |
|---|---|
| First-line support | acknowledge, classify, resolve P3/P4, escalate P1/P2 |
| Finance lead | escalations touching escrow, payouts, refunds, duplicate charges |
| Head of operations | conduct complaints, internal reviews, unreasonable-conduct decisions |
| Data Protection Officer | every complaint touching personal data; NDPC liaison |
| Administrator | account and listing decisions arising from a complaint |

## 9. Record keeping and reporting

Every complaint should produce a record that answers: what was it about, how
severe, when was it acknowledged, who handled it, what was decided, why, and what
was done. The retention question is already settled — the Privacy Policy's
retention table applies, and complaint records follow tickets and disputes.

Monthly report (proposed, for the board and for the complaints review the policy
promises):

- volume by topic and severity;
- acknowledgement and resolution within SLA, as percentages;
- outcomes: upheld / partially upheld / not upheld / withdrawn;
- money moved: refunds issued, escrow released after a dispute;
- repeat complainants, and complaints that cite a previous complaint;
- postcode of failure: which *step* in the journey generates them (checkout,
  collection, payout), so the fix is a platform change rather than more support.

## 10. Gaps — what is closed, what remains

**Closed in this build** (verified live, 28 checks):

| # | Gap | How it was closed |
|---|---|---|
| 1 | No classification on the ticket record | `tickets` gained `category` (9 values), `severity` (p1–p4), `source` and a human `reference`. The category is derived from the contact form's topic and can be set directly when a complaint is opened from the dashboard. |
| 2 | No acknowledgement automation | `TicketService.create()` stamps `acknowledgedAt`, schedules `dueAt`, and emails the complainant the reference and the date we aim to answer by. The reference is also returned to the form, so it is visible without waiting for the email. |
| 3 | No SLA monitoring | `dueAt` is set from severity in business days (P1 5, P2 10, P3 15, P4 20); the admin queue is ordered by it, carries a live `sla` state (`on_track` / `due_soon` / `overdue`), and `/tickets?overdue=true` filters to breaches. `GET /tickets/sla/summary` gives counts, `/tickets/performance` gives outcomes and compliance. |
| 4 | No internal-review tier | `PATCH /tickets/:id/escalate` records `escalatedAt` and `escalatedToId`, and **refuses** an escalation to the first responder — the independence the policy promises is enforced, not trusted. |
| 7 | No vexatious / unreasonable-conduct flags | `closureReason` enum (`resolved`, `vexatious`, `unreasonable_conduct`, `duplicate`, `no_response`, `other`) and `outcome` enum (`upheld`, `partially_upheld`, `not_upheld`, `withdrawn`, `referred`). Resolving without an outcome, or closing without a reason, is a 400. |

**Also closed:** the hourly sweep (`TicketSlaCron`) sends the proactive "we are
still working on it" notice once per ticket — the policy's "we tell you before it
passes, not after" — with `slaNotifiedAt` making it idempotent. It can be run on
demand with `POST /tickets/sla/sweep` after a restart rather than waiting for the
hour.

**Closed in the follow-through pass** (verified live, 26 checks):

| # | Gap | How it was closed |
|---|---|---|
| 5 | Partial refunds impossible | `POST /escrow/holds/:id/partial-refund` refunds part of the buyer's bill and **keeps the hold open** with the remainder, so the rest can still be released. The refund is allocated pro rata across seller / platform / VAT, which is the only split that is neutral between the parties and keeps `sellerNet + platformShare + vat = amount` exactly true; rounding residue goes to VAT. It refuses a refund larger than the remainder, requires a reason, records a breakdown on the hold, and credits the buyer through the ledger (`escrow_partial_refund:<hold>:<n>`). Asking for the full remainder delegates to the existing full refund so the invoice, order and lot unwind as before. |
| 6 | No goodwill credit | `POST /admin/wallets/:userId/credit` — a required reason, a unique `goodwill:<uuid>` reference, and a new `ADJUSTMENT` ledger type so a discretionary credit never looks like a customer deposit in reporting. |
| 8 | No complaint register | `GET /admin/complaints/register` returns one row per complaint with a summary (total, open, by category, by outcome) and `?format=csv` produces the file for the monthly review or a regulator. |
| 9 | No appeal on a dispute | `POST /disputes/:id/appeal` — party only, decided disputes only, **once**. It reopens the case for review, records the reason and count, and clears the previous decision so the reviewer is not anchored by it. |
| 10 | Review flags went nowhere | `POST /sellers/reviews/:id/report` lets any signed-in user report a review (previously only an admin could set the flag, so the published channel did nothing), and `GET /admin/reviews/flagged` + `PATCH /admin/reviews/:id/decision` give it a queue and an outcome. Hiding is the default decision in a dispute, because the review is evidence. |
| 11 | Data-protection complaints had no statutory clock | They are classified P1 **and** now carry `statutoryDueAt` / `statutoryDaysLeft` on the SLA view — 30 calendar days from when they were raised — with `dataProtectionOpen` and `dataProtectionOverdue` in the SLA summary so the legal deadline is visible next to the operational one. |

**Closed in the workspace pass** (verified live, 17 checks):

| # | Gap | How it was closed |
|---|---|---|
| 12 | No admin UI for the new endpoints | The complaints workspace gained a toolbar above the conversation panes: **service-level chips** (open / overdue / due soon / awaiting first reply / data-protection, including how many are past the statutory clock), an **Export register** button that downloads the CSV, a **Reported reviews** panel with hide / remove / dismiss-report per item, and a **Goodwill credit** form that posts to the wallet endpoint with a required reason. Partial refund stays API-only on purpose — a ticket carries no invoice reference, so there is nothing to point the control at yet (see below). |
| 13 | Appeals notified nobody | `DisputeService.appeal` now notifies the other party and the previous resolver, with the appeal itself committed first. The first attempt used `type: 'dispute' as any`, which the database enum rejected — and the catch swallowed it, so the appeal succeeded in silence. Fixed by adding a real `dispute_appealed` notification type (entity + migration) and logging delivery failures instead of discarding them. |
| 14 | Register covered only tickets | `GET /admin/complaints/register` now joins disputes into one export: a `kind` column distinguishes them, the summary reports `complaints` and `disputes` separately, appeals surface on the dispute row, and the CSV carries both. |
| 15 | Refund allocation was pro rata only | `partialRefund` accepts an optional `allocation: { sellerNet, platformShare, vat }`. It must sum to the refund and may not exceed any component — both are 400s — and the chosen split is recorded in the hold's breakdown, so a negotiated "the seller absorbs it" is what the ledger shows. Omitted still means pro rata, the neutral default. |

**One item left, deliberately:**

| # | Gap | Why it is not built | Next step |
|---|---|---|---|
| 16 | **Partial refund has no admin control** | A ticket has no invoice or hold reference, so a complaint handler cannot reach the escrow from the queue. Putting the button in the complaints workspace would mean guessing which hold to touch — worse than no button. It needs a link: either `tickets.invoiceId`, or an invoice/escrow lookup inside the workspace. | Add `invoice_id` to the ticket (nullable) and populate it when a complaint is opened from a purchase; then the partial-refund dialog has somewhere to point. |

**Risks introduced by closing them:**

- **Partial refunds change `hold.amount`.** Anything reading a hold's original value must read `amount + refundedAmount`. The admin KPI `escrowFloat` sums `amount`, which is correct (it is what is still held), but a report of "original sale value" would now be short.
- **The `ADJUSTMENT` ledger type is new.** Reporting that assumes wallet credits are only deposits or escrow releases needs to handle it; the enum was extended rather than reused for exactly that reason.
- **An appeal clears `resolution`/`resolvedById`.** That is deliberate — the reviewer must not be anchored — but the previous outcome now survives only in the messages and the audit trail, so never rely on the dispute row for the full history.
- **Notifications can fail after the thing they describe succeeded.** The appeal commits, then the notice is attempted; a delivery failure is now logged rather than hidden, but nothing retries it. If appeals matter enough to guarantee delivery, they need an outbox.
- **A reported review hides the seller's rating input.** Hiding a review removes it from the average, so a false report briefly distorts the rating until the decision is made. Acceptable, but the queue should be worked promptly.

## 11. Decisions taken

The nine questions in the previous version are decided. Recorded here so the
reasoning survives, together with what the code now enforces.

| # | Decision | Rationale | Enforced by |
|---|---|---|---|
| 1 | **Keep 2 business days to acknowledge; 10/20 to resolve, with P1 at 5.** | The published promise stays as written; the risk of over-promising is handled by *measuring* — `/tickets/performance` reports acknowledgement and response compliance, so a missed quarter is visible rather than guessed | `ACK_BUSINESS_DAYS`, `RESOLVE_BUSINESS_DAYS` in `ticket-sla.service.ts` |
| 2 | **A complaint is a ticket subtype, not a new entity.** | Reuses the message thread, the admin screen, notifications and the audit trail. A parallel `complaints` table would have duplicated all four | `tickets` columns + `TicketSlaService` |
| 3 | **One operational owner: a Complaint Officer inside support**, with the DPO owning anything touching personal data. | Every remaining gap needs a name against it, and the DPO route already exists | Documented here; named at appointment |
| 4 | **Two-person approval above ₦1,000,000 for refunds.** | Money movement decided by a single person while handling a complaint is where fraud hides | Policy (not code): refunds already sit behind admin roles; the second signature is an operating control |
| 5 | **No ADR scheme for now; FCCPC and the courts.** | Joining an ADR scheme is a commitment with fees; the policy must not promise a route we have not joined | Complaints Policy §6 |
| 6 | **Publish complaint statistics quarterly — after the register exists.** | Publishing forces the reporting to be real, but publishing hand-assembled numbers invites error | Blocked on gap 8 |
| 7 | **Adverse account action pauses while a P1/P2 complaint is open.** | Suspending someone who is complaining about withheld money reads as retaliation and is exactly what a regulator looks for | `AdminService.setBuyerStatus` refuses with 409 and names the open references; `force: true` is the documented override and is echoed back |
| 8 | **The policy covers conduct between users, not just house-to-user.** | Buyer-to-buyer and seller-to-seller complaints arrive anyway; the taxonomy and the conduct category absorb them | `TicketCategory` + Complaints Policy §3 |
| 9 | **Complaints about staff route to the head of operations and are reviewed by someone outside that person's line.** | A complaint about an employee must not be decided by a peer | `escalate` refuses the first responder; head-of-ops routing is policy |

## 12. Maintenance

- Policy text: `content/legal/complaints-policy.md` → `node tools/legal/load-legal.js`.
- Taxonomy changes must move **three** things together: the topics in
  `contact_form.tsx`, the channel table in the policy, and §3 of this document.
  They are the same list in three places by necessity (the ticket table has no
  category column yet), which is exactly why gap 1 is the first thing to fix.
- Review the policy when an SLA is missed for a quarter, when a new channel is
  added, or when the external escalation landscape changes (a new regulator, or
  an ADR scheme joined).

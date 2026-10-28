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

## 10. Gaps between the policy and the platform

Ordered by the risk of failing to deliver what the policy now promises.

| # | Gap | Consequence | Fix |
|---|---|---|---|
| 1 | **No classification on the ticket record.** Topic lives only inside the subject line of contact-form submissions; a ticket opened from the dashboard has none. | Cannot report by topic; triage stays manual. | Add `category`, `severity`, `acknowledged_at`, `first_response_at`, `due_at`, `outcome` to `tickets` (one migration), and a category select to the dashboard ticket form. |
| 2 | **No acknowledgement automation.** Nothing sends the reference number or starts the 2-business-day clock. | The first published promise is unmet on every complaint. | On ticket create: email the user the reference, stamp `acknowledged_at`, set `due_at` from severity. |
| 3 | **No SLA monitoring.** No view of overdue tickets, no slip warnings. | The 10/20-day commitments are unenforceable — we would not know we missed. | Admin queue sorted by `due_at` with an overdue badge; a daily cron that flags slipping tickets. |
| 4 | **No internal-review tier.** An escalation is just another message on the same ticket. | "Someone senior who was not involved" is unverifiable, and the audit cannot show independence. | `escalated_at`, `escalated_to`, `reviewer_id`, with a constraint that reviewer ≠ first responder. |
| 5 | **Partial refunds impossible.** | Disputes that should settle at 50% can only be all-or-nothing, which pushes both sides to extremes. | Partial-amount refund on the hold, plus a resolution reason. |
| 6 | **No fee waiver / goodwill credit endpoint.** | A remedy the policy implies cannot be executed without database access. | Admin wallet-credit endpoint with a reference and an audit entry. |
| 7 | **Vexatious / unreasonable-conduct flags do not exist.** | The policy says such complaints "will be closed, and we will tell you why" — no field records that. | `closure_reason` enum on the ticket, including `vexatious` and `unreasonable_conduct`. |
| 8 | **No complaint register or export.** | The monthly report has to be assembled by hand from three tables. | A reporting query (or view) joining tickets and disputes by topic and outcome. |
| 9 | **No appeal route on a dispute outcome.** | Disputes have `resolved`/`rejected` and nothing after; the policy promises an internal review. | Allow a dispute to be reopened once, or an explicit `appeal` record linked to it. |
| 10 | **Review flags go nowhere visible.** A flag is stored, but there is no queue and no outcome. | "Flag a review" is offered as a channel that silently absorbs complaints. | Add flagged reviews to the admin complaints queue with a decision (`uphold` / `remove`). |
| 11 | **Data-protection complaints have no dedicated route.** They arrive as an ordinary ticket unless the user emails the DPO. | s.34–38 rights requests can sit in a support queue with no clock. | A `data_protection` topic that routes to the DPO queue and starts the statutory clock (see `docs/privacy/PRIVACY-SECTION.md` gap 5). |

## 11. Decisions needed

| # | Question | Why it matters | Recommendation |
|---|---|---|---|
| 1 | **Are these SLAs staffable?** 2 business days acknowledge, 10/20 to resolve | Publishing a promise we cannot keep is worse than a slower honest one | Confirm cover for weekends and public holidays first; if not, publish 3 business days |
| 2 | **Is a complaint a new entity or a ticket subtype?** | Determines whether #1 above is a migration on `tickets` or a new `complaints` table | Ticket subtype with severity and outcome fields — it reuses the message thread, the admin screen and the notifications we already have |
| 3 | **Who owns complaints operationally?** A named person, not a team. | Every gap in §10 needs an owner to be closed | Name a Complaints Officer, with the DPO as the data-protection route |
| 4 | **Refund authority thresholds** — who may approve a refund without a second signature, and up to what value | Money movement plus complaint handling is where fraud hides | Two-person approval above a threshold (e.g. ₦1m), recorded on the dispute |
| 5 | **Do we join an ADR scheme?** (e.g. Lagos Multi-Door Courthouse) | The policy names the courts and FCCPC; an ADR scheme is cheaper for everyone | Consider it once volume justifies it; do not promise it until joined |
| 6 | **Do we publish complaint statistics?** | Trust-building, and it forces the reporting in §9 to be real | Publish quarterly once the register exists — not before |
| 7 | **Should a formal complaint pause account decisions?** (e.g. suspension for non-payment while a payment complaint is open) | A suspension during an open money complaint looks like retaliation | Yes: hold adverse account action while a P1/P2 complaint on the same matter is open, and say so in the policy |
| 8 | **Should the policy cover seller-to-seller and buyer-to-buyer conduct?** | Currently only buyers and sellers in a transaction are addressed | Yes — conduct complaints between users should follow the same route |
| 9 | **How are complaints about GreyAuction staff handled differently?** | A complaint about an employee must not be decided by that employee's peer | Route to head of operations, record separately, exclude from the staff member's normal queue |

## 12. Maintenance

- Policy text: `content/legal/complaints-policy.md` → `node tools/legal/load-legal.js`.
- Taxonomy changes must move **three** things together: the topics in
  `contact_form.tsx`, the channel table in the policy, and §3 of this document.
  They are the same list in three places by necessity (the ticket table has no
  category column yet), which is exactly why gap 1 is the first thing to fix.
- Review the policy when an SLA is missed for a quarter, when a new channel is
  added, or when the external escalation landscape changes (a new regulator, or
  an ADR scheme joined).

# Privacy section — design, NDPA mapping and gaps

**Written 2026-10-28.** Two documents, published as CMS content pages:

| Document | Route | Audience |
|---|---|---|
| **Privacy Policy** (`content/legal/privacy-policy.md`) | `/privacy-policy` | buyers, sellers, visitors — what happens to their data |
| **Data Protection** (`content/legal/data-protection.md`) | `/data-protection` | rights requests, a seller's compliance team, auditors, the Commission — how we meet the Act |

```bash
node tools/legal/load-legal.js            # publish both
node tools/legal/load-legal.js --dry-run  # preview
```

The split is deliberate. A privacy notice answers "what do you do with my data";
an accountability statement answers "how do you meet the Act". Mixing them
produces a document that serves neither reader — the buyer wades through lawful
bases, the auditor cannot find the breach procedure.

I read the **Nigeria Data Protection Act 2023** from the PDF supplied (47 pages,
a scan with no text layer, so I read the pages directly). Section references
below are from that copy's arrangement of sections.

---

## 1. What the Act requires, and where we stand

| NDPA provision | Requirement | Where it is addressed | Status |
|---|---|---|---|
| s.24 | Principles: lawfulness, purpose limitation, minimisation, accuracy, storage limitation, security, accountability | Policy §2, Data Protection §2 | **Met in the documents** |
| s.25 | A lawful basis for every processing activity | Data Protection §3 — one row per activity | Met |
| s.26 | Consent: freely given, specific, informed; withdrawal | Policy §3, §6; Data Protection §5. Marketing uses double opt-in and unsubscribe | **Partial** — see gap 2 |
| s.27 | Information to be given to the data subject | Policy, in full | Met |
| s.28 | Data protection impact assessment | Data Protection §6 — four assessed activities | **Partial** — no written DPIAs on file, see gap 6 |
| s.29 | Obligations of controllers and processors | Data Protection §4, §8 | Met in document; processor DPAs not yet signed (gap 7) |
| s.30 | Sensitive personal data | Policy §4, Data Protection §6, §7 | **At risk** — see gap 1 |
| s.31 | Children, and persons lacking capacity | Policy §11 — 18+ | **Partial** — no age gate, see gap 3 |
| s.32, s.33 | Data Protection Officer; compliance services | Data Protection §12 | **Not yet true** — see gap 4 |
| s.34–38 | Rights: access, correction, deletion, restriction, objection, portability, automated decisions | Policy §6, Data Protection §5 — a route per right, not a promise | **Partial** — see gap 5 |
| s.39 | Security, integrity and confidentiality | Policy §10, Data Protection §7 | Met, with one exception (§ gap 1) |
| s.40 | Personal data breaches | Data Protection §10 — six-step procedure, Commission plus data subjects | **Partial** — no incident register or 72-hour clock in code (gap 8) |
| s.41–43 | Cross-border transfers, adequacy, other bases | Policy §8, Data Protection §11 — adequacy, contract necessity, explicit consent with risk information | **Partial** — mechanism per destination not yet recorded (gap 9) |
| s.44 | Registration of controllers of *major importance*; notify changes within 60 days | Data Protection §13 | **Not done** — see gap 4 |
| s.49, s.51, s.53 | Penalties, civil remedies, vicarious liability | Referenced by implication; policy states no-charge rights handling | Awareness only |

**"Met" here means the published document states an accurate position.** It does
not mean the platform evidence exists — several gaps below are engineering, not
wording.

## 2. What was built

- **Two CMS pages**, authored as markdown in `content/legal/` and published via
  `PUT /content/:slug`, so they are editable in the admin legal-page editors
  afterwards. The file is the source of truth for the text; edit there, not in
  both places.
- **A real renderer.** The legal page previously turned content into plain
  paragraphs, so a policy with headings, lists and tables would have arrived as
  one wall of text. It now renders a markdown subset — `##`/`###` headings,
  ordered and unordered lists, tables, bold, italics and links — plus a table of
  contents for long documents, a "last updated" line, and a cross-link to the
  sibling document.
- **A footer entry** for Data Protection in the legal column, translated in
  `en`/`fr`/`nl`.
- **A bug fix that changed what users saw:** the legal page fetched
  `NEXT_PUBLIC_API_URL`, which in this app is the relative `/api/proxy` path.
  `fetch` cannot resolve a relative URL on the server, so the request threw and
  the page silently rendered its hardcoded fallback — meaning **every privacy
  and terms page had been serving three paragraphs of placeholder text** no
  matter what an administrator saved. It now uses `SERVER_API_BASE`.

## 3. Content decisions worth knowing

**App-specific, not generic.** The policy describes what this platform actually
does: escrow and the seller wallet, KYC as seller-only, invitations and private
rooms, the wallet PIN, disputes and their evidence, audit logging, the double
opt-in, and the two automated processes. A privacy notice that could belong to
any website tells a reader nothing.

**Automated decisions are disclosed honestly.** Listing screening and seller risk
scoring are named (Policy §9), with the material fact stated plainly: neither
takes a *final* decision — an administrator makes every publish decision and a
person will review an automated outcome on request. That is what keeps us inside
s.37 rather than pretending there is no automation.

**Retention is stated per record type**, including the uncomfortable part: sale
and payout records survive account closure because tax and company law require
it, and we say so rather than implying deletion is total.

**Transfers are described with the mechanism, not brushed past.** Data Protection
§11 sets out adequacy first, contract necessity second, and explicit consent
**with risk information** third — which is what s.43(1)(a) actually asks for, and
which most published policies quietly omit.

**Counterparties see only what completes a sale.** Stated in Policy §8 because it
is the question a bidder actually asks: who can see my name and address.

## 4. Gaps between the documents and the platform

These are ordered by legal exposure. Each is a **platform** change, not a wording
change; the documents currently describe the intended position.

| # | Gap | Exposure | Fix |
|---|---|---|---|
| 1 | **Identity documents may sit in a publicly readable bucket.** Uploads for KYC (`kyc/`) and seller documents land in the same object storage as lot photographs, and the deployment makes that bucket anonymously readable. | **High.** Sensitive personal data available to anyone with the URL, which is a s.30 + s.39 failure and a notifiable breach waiting to happen. | Already raised as P0 in `docs/deployment-checklist.md` §6.3: a private bucket plus presigned, short-lived reads, storing the key rather than the URL. **Must land before any real seller uploads documents.** |
| 2 | **No evidence of consent at registration.** There is no acceptance of Terms/Privacy recorded against the user, and no timestamp or version. | Medium. s.26 and s.27 evidence; also weakens the Terms' enforceability. | Add `accepted_terms_at`, `accepted_terms_version` and `accepted_privacy_version` to the user record, tick-box at registration, and show the version in Account settings. |
| 3 | **No age gate.** Nothing captures or checks date of birth. | Medium. s.31; a bid is a contract a minor cannot form. | Self-declared 18+ confirmation at registration (recorded), plus a DOB field for sellers at KYC. |
| 4 | **No DPO appointed and no NDPC registration.** Both are stated in the published Data Protection page. | **High if published as fact.** s.32 and s.44. The page names `privacy@greyauction.com` as the DPO contact. | Appoint the DPO, register with the Commission if we meet the *major importance* threshold, then publish. Until then the page must not go live — see §5. |
| 5 | **Rights are only partly self-service.** Correction and deletion exist; there is no export (portability), no restriction flag, and no recorded objection. | Medium. s.34–38 are answered by hand, which is lawful but slow and unauditable. | Add an account data export (JSON), a `processing_restricted` flag honoured by non-essential processing, and log every rights request with its outcome — a "rights register" is the cheapest audit evidence there is. |
| 6 | **No written DPIAs.** The Data Protection page refers to four assessments; none is on file. | Medium. s.28. | Write and date four short DPIAs: KYC, automated screening/risk scoring, payouts/bank details, payment processing. The page already contains their substance — it needs to be taken out as standalone records. |
| 7 | **No signed processor agreements.** s.29 requires processors to be bound in writing. | Medium. | Template DPA sent to Cloudflare, the payment providers, Brevo, Termii/Twilio, Google and the AI screening provider; keep copies with the processor register. |
| 8 | **No breach process in code.** No incident register, no notification clock, no contact list. | Medium-High. s.40 expects a demonstrable procedure. | Create `docs/privacy/BREACH-RUNBOOK.md` with owners, timings and a template notice, plus an incident log (a sheet is enough to start). |
| 9 | **Transfer mechanisms not recorded per destination.** | Medium. s.41–43. | Fill a transfer register: destination, processor, data, mechanism (adequacy decision / SCCs / contract necessity + risk consent), review date. |
| 10 | **No retention automation.** Crons exist for settlement and escrow, none for retention; the schedule is a promise with no enforcer. | Low-Medium. Storage limitation is a principle, so drift is a slow failure. | A weekly retention cron per the table in Data Protection §9, deleting rather than flagging, with a count logged. |
| 11 | **Marketing consent is email-only.** Subscription is double opt-in and can be withdrawn — good — but there is no record of *where* consent was given. | Low. | Log source and timestamp on the subscription row. |

## 5. Before publishing — read this

Two of the claims in the Data Protection page are **not yet true of the platform**:
the DPO appointment (§12) and registration with the Commission (§13). The identity
documents claim in the Privacy Policy §4 depends on gap 1 being fixed.

Publish when, and only when:

1. a DPO is appointed and `privacy@greyauction.com` reaches them;
2. NDPC registration is done, or the threshold analysis concludes we are not a
   controller of major importance (record that decision either way);
3. the private-bucket work in deployment checklist §6.3 has landed, so
   "private object storage that is not publicly addressable" is literally true;
4. the legal entity name, registered address and RC number in Policy §1 are correct.

Until then the pages exist as CMS content and render — which is right for review
and wrong for going live. If they must go live earlier, amend those three claims
first; a published policy that misdescribes the platform is worse than a short
honest one.

## 6. Areas needing your decision

| # | Question | Why it matters | What I recommend |
|---|---|---|---|
| 1 | **Is GreyAuction a controller of *major importance*?** (s.65 criteria: volume and sensitivity — identity documents, financial records, and how many data subjects) | Decides whether registration and the higher penalty band apply | Take counsel's view, write it down with the reasoning, and revisit annually. Assume yes until answered — the cost of registering is lower than the cost of being wrong |
| 2 | **Who is the DPO?** Name, contact and whether it is an internal appointment or an outsourced service (s.33 allows compliance services) | The page names a contact; s.44 requires the DPO's details in the registration | Name a person, not a mailbox, with a deputy. If outsourced, still publish a route that reaches a human |
| 3 | **Legal entity and registered address** for Policy §1 | A policy must identify its controller properly | Fill from the CAC record before publication |
| 4 | **Do we want a "do not sell/share" attestation** (CCPA-style) even though Nigeria has no equivalent? | International bidders ask; it costs one sentence | Keep the plain statement already in the policy ("we do not sell personal data"); do not import US frameworks wholesale |
| 5 | **Retention for identity documents specifically** — indefinite "while the verification must be demonstrable" is vague | s.24 storage limitation; also the biggest sensitivity | Pick a period (e.g. verification plus 12 months, or the AML period your counsel advises) and set the cron to it |
| 6 | **Are reviews ever removed at the reviewer's request?** The policy says they stay while the profile is live | A tension between erasure and marketplace integrity | Allow anonymisation of the reviewer without deleting the rating — say so explicitly |
| 7 | **Do sellers' contact persons get their own notice?** The seller record holds named individuals who never created an account | Those people are data subjects too and have no way to know | Add a short "your details were provided by your employer" notice, sent when a contact person is first added |
| 8 | **Cookies:** is the consent banner actually gating anything, or informational only? | If nothing is gated, the banner is theatre and the policy says "all cookies are necessary", which is defensible only if true | Confirm the only cookies are session + preferences, then keep the banner informational and consistent with Policy §7 |
| 9 | **Cross-border risk consent** (s.43(1)(a)) — will we rely on it for any destination? | If yes, the consent must name the risk at the point of collection | Prefer adequacy/SCCs; if risk consent is used, add the sentence to registration and re-consent on change |
| 10 | **Data subject request SLA** — the policy commits to 30 days | The Act's timeline should be confirmed with counsel, and support needs a queue | Adopt 30 days as policy, log every request, and report breaches of it internally |
| 11 | **Aggregated analytics:** is anything third-party embedded (pixel, tag manager)? | Any tag changes the cookie and transfer position | Nothing is embedded today. Keep it that way, or add the tag to §8 and §7 before shipping it |

## 7. Maintenance

- Edit the markdown in `content/legal/`, then `node tools/legal/load-legal.js`.
  Do not edit in the admin editor *and* the file — the file wins on the next run.
- Change the `_Last updated:_` line whenever substance changes; the page renders
  it directly under the title and readers (and auditors) look for it.
- Re-read both documents whenever a processor is added, a purpose changes, a new
  data category is collected, or a retention period moves. Those are the four
  triggers that make a policy out of date.
- Keep the Data Protection page and the deployment checklist in step: gap 1 in
  this document is P0 in that one, and only one of them should be closed first —
  the storage fix, before anyone uploads a passport.

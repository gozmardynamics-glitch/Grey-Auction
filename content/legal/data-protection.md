# Data Protection

_Last updated: 28 October 2026_

This statement explains how GreyAuction meets its obligations under the **Nigeria Data Protection Act 2023** (the "NDPA"). Our [Privacy Policy](/privacy-policy) tells you what we do with your data; this page sets out the machinery behind it — the lawful basis for each activity, how each right is actually handled, who processes data for us, where it goes, how we keep it secure, and what happens when something goes wrong.

It is written for anyone who needs to hold us to account: a data subject exercising a right, a seller's compliance team, an auditor, or the Nigeria Data Protection Commission.

## 1. Scope and role

We are the **data controller** for the personal data described in the Privacy Policy: we determine the purposes and means of processing. Where a supplier processes data only on our documented instructions, it is a **data processor** and is listed in §8.

The NDPA applies to us because we are established in Nigeria and process personal data in the course of running an auction platform. We process data for the purposes set out in §3, and for no others without telling you first.

## 2. Principles we work to

The NDPA sets principles, not just rules. How each one lands on this platform:

| Principle | What it means here |
|---|---|
| **Lawfulness, fairness, transparency** | Every purpose has a stated basis (§3). This page and the Privacy Policy are the transparency. |
| **Purpose limitation** | Data collected for verification is not used for marketing; bid history is not sold or shared with other bidders beyond what the auction itself displays. |
| **Data minimisation** | Buyers are not asked for identity documents. Sellers are asked only for the documents the current requirement list names. Contact details are never shown to other users. |
| **Accuracy** | You can correct your own profile; verification outcomes carry the reviewer's note so a rejection can be understood and fixed. |
| **Storage limitation** | Retention periods are fixed in §9. Financial records outlive account closure because the law requires it; nothing else does. |
| **Integrity and confidentiality** | Controls in §7: hashed secrets, HTTP-only sessions, role-based access, audit logging, private document storage, rate limiting. |
| **Accountability** | This statement, the processing register in §4, the impact assessments in §6, and the breach process in §10. |

## 3. Lawful basis, activity by activity

| Activity | Personal data | Basis (NDPA s.25) |
|---|---|---|
| Creating and maintaining an account | Name, email, phone, address, password hash | Contract |
| Verifying a seller (KYC) | Identity documents, business registration, tax ID | Legal obligation, and contract (a seller cannot publish without it) |
| Running an auction: bids, auto-bids, lot views, follow list | Bid history, participation, device/technical data | Contract |
| Invoicing and taking payment | Name, address, invoice and payment records | Contract; legal obligation for the accounting record |
| Escrow, wallet and seller payouts | Wallet ledger, bank account details, wallet PIN hash | Contract; legal obligation (anti-money-laundering and tax records) |
| Delivering a purchase | Delivery address, recipient name and phone, carrier records | Contract |
| Support, disputes and mediation | Ticket and dispute text, attachments | Contract; legitimate interests (resolving disputes, defending claims) |
| Reviews | Reviewer identity, review text, per-criterion scores | Contract; legitimate interests (marketplace trust) |
| Platform security and abuse prevention | IP address, user agent, request identifiers, audit log | Legitimate interests; legal obligation where we must retain evidence |
| Lot screening and seller risk scoring | Listing text and images, verification status, compliance signals | Legitimate interests (preventing counterfeit and prohibited sales); human review on request |
| Marketing email | Email address, subscription status | **Consent** (double opt-in, withdrawable at any time) |
| Analytics and service improvement | Aggregated usage metrics | Legitimate interests, using aggregated data wherever possible |

Where we rely on **legitimate interests**, we have balanced them against your rights and concluded the processing is proportionate: it is limited to running a secure marketplace, no special-category data is involved, and you can object (§5). Where we rely on **consent**, refusing or withdrawing it has no other consequence.

## 4. Record of processing

We maintain a record of processing activities, as the NDPA requires of a controller. Its shape, so you know what we hold ourselves to:

- the purpose of each activity and its lawful basis;
- the categories of data subject (buyers, sellers, seller staff, platform administrators) and of personal data;
- the categories of recipient, including every processor in §8;
- any transfer outside Nigeria, with the mechanism relied on (§11);
- the retention period and the technical and organisational measures protecting it;
- where the data came from, when it did not come from you.

## 5. Your rights, and how we actually fulfil them

The NDPA gives you rights over your data. Each has a route — not a promise of one:

| Right | How it works here |
|---|---|
| **Access / confirmation** | Email privacy@greyauction.com from your account address. Much of the data is already visible in your dashboard: bids, invoices and their PDFs, wallet ledger, reviews, tickets and dispute history. |
| **Correction** | Name, phone, address and account preferences are editable in Account settings and take effect immediately. Email address and invoice details are corrected by support, because they identify the account and the accounting record. |
| **Deletion** | Request it from Account settings or by email. We deactivate the account, remove profile data, and retain only the financial and sale records the law requires — flagged as retained, not silently kept. |
| **Restriction** | Ask us to pause processing while a question about accuracy or lawfulness is resolved. We will confirm in writing what is paused. |
| **Objection** | You may object to processing based on legitimate interests. We stop unless we can show compelling grounds, and we always stop direct marketing on request. |
| **Portability** | You can obtain the data you provided in a structured, commonly used, machine-readable format. Invoices are already downloadable as PDF; anything else is exported on request. |
| **Withdrawing consent** | Marketing consent is withdrawn with the unsubscribe link in any message, or by email. Withdrawal does not affect anything done before it. |
| **Automated decisions** | Listing screening and seller risk scoring are described in the Privacy Policy §9. Neither takes a final decision about you: a person makes every publish decision, and you can require human review of an automated outcome. |

**Timelines.** We acknowledge a request as soon as we receive it and aim to resolve within 30 days. Where a request is complex — for example an export spanning years of sale records — we will tell you why and when to expect it. We may need to verify your identity first, particularly for anything touching identity documents or payout details.

**No detriment.** Exercising a right never costs you bidding privileges, and there is no charge unless a request is manifestly unfounded or repetitive.

## 6. Risk assessment and privacy by design

The NDPA requires an assessment before processing that is likely to result in a high risk to rights. We assess:

- **Identity verification (KYC).** Sensitive documents, a real harm if exposed. Mitigations: private storage, restricted access, short-lived retrieval links, retention limits, and review by a named administrator rather than broad staff access.
- **Automated listing screening and seller risk scoring.** These influence whether a seller can trade. Mitigations: advisory-only output, a human deciding, an explanation available on request, and an appeal route.
- **Payout and bank details.** Fraud and account-takeover risk. Mitigations: hashed PIN, attempt throttling, a rest period after a bank-detail change, and no bank detail shown to any other user.
- **Payment processing.** Reduced by design: card data never reaches us.

Privacy by design shows up in ordinary decisions on this platform — buyers are not asked for identity documents, counterparties see only what completing a sale requires, and public listings deliberately project a safe subset of the seller record rather than the whole row.

## 7. Security of processing

Proportionate to what is at risk:

| Control | Detail |
|---|---|
| Secret handling | Passwords and the wallet PIN are stored as one-way hashes, never in readable form. One-time email codes are short-lived. |
| Session security | Sign-in sessions live in encrypted, HTTP-only cookies that browser scripts cannot read; the API token is never exposed to the page. |
| Access control | Administrative actions require a verified administrator identity and an explicit role. Authority is resolved through the administrator record, not a token claim. |
| Auditability | Privileged actions are written to an audit trail recording actor, action, before/after values, address and time. |
| Abuse resistance | Sign-in, code entry, PIN attempts and bidding are all rate-limited; repeated failed attempts are throttled per identity and per address. |
| Document storage | Identity documents are held outside public content and retrieved through short-lived links, not through guessable public addresses. |
| Public projections | Public endpoints return a deliberately narrow projection of the seller and bidder records — never email, phone, address or internal notes. |
| Transport | Traffic is encrypted in transit end to end, with the edge and origin both enforcing HTTPS. |
| Backups | Encrypted database backups are taken automatically and stored in private object storage with a retention limit. |

Nobody at GreyAuction can read your password or PIN; support can reset them, not retrieve them.

## 8. Who processes data for us

| Processor | What it does | Data involved | Location |
|---|---|---|---|
| Cloud hosting and delivery (Cloudflare) | Serves the site, filters hostile traffic, stores uploaded files | Request metadata, uploaded documents and images | Global network, primary storage in the region we select |
| Payment providers | Takes buyer payments and makes payout transfers | Amount, reference, identity data their regulation requires | Nigeria, and the provider's own infrastructure |
| Email delivery | Invoices, verification codes, invitations, outbid notices, announcements | Email address, message content | EU / US |
| SMS delivery | Invitation and verification messages | Phone number, message content | Nigeria / US |
| Google (only if you choose Google sign-in) | Confirms your email address at sign-in | Email address, name | US |
| AI screening provider (lot moderation) | Screens listing text for prohibited and counterfeit goods | Listing title and description — not bidder identity | US |
| Exchange-rate feed | Supplies indicative currency rates | No personal data | Public data |

Each processor is bound by written terms: process only on our instructions, keep it confidential, apply appropriate security, assist with rights requests, and delete or return data at the end. We do not authorise any processor to use your data for its own purposes.

**We do not sell personal data and we do not share it for advertising.**

## 9. Retention

| Record | Period | Then |
|---|---|---|
| Identity documents | For as long as the verification must be demonstrable | Deleted; a record that verification occurred is kept without the images |
| Account profile | Life of the account | Removed on closure, subject to the records below |
| Invoices, payments, wallet ledger, payouts | The period Nigerian tax and company law requires | Deleted or anonymised |
| Bids and sale records | With the sale record, for dispute and audit purposes | Anonymised, retaining the transaction |
| Support tickets and disputes | A limited period after closure of the matter | Deleted |
| Reviews | While the seller profile is live | Removed with the profile |
| Audit and security logs | A short operational window | Deleted |
| Marketing subscriptions | Until unsubscribed | Suppressed so you are not re-added |

Where a statutory retention obligation applies to a sale, the record survives account closure — that is a legal requirement, not a preference, and we will say so plainly when you ask us to delete.

## 10. Personal data breaches

If personal data is accidentally or unlawfully destroyed, lost, altered, disclosed or accessed, we follow a fixed procedure:

1. **Contain** — stop the exposure first (revoke access, rotate credentials, close an endpoint), then investigate.
2. **Assess** — what data, how many people, how sensitive, and what harm is realistically possible: identity fraud, financial loss, exposure of identity documents.
3. **Record** — every breach is logged whether or not it is notifiable, with facts, effects and remedial action.
4. **Notify the Commission** — where a breach is notifiable, we notify the Nigeria Data Protection Commission without undue delay and within the timeline the NDPA prescribes, describing the nature of the breach, the likely consequences and the measures taken.
5. **Notify data subjects** — where a breach is likely to result in a high risk to your rights, we tell you directly and clearly: what happened, what it means for you, and what you should do.
6. **Remediate** — fix the cause, not just the symptom, and record what changed.

We will not wait for a complete picture before warning people where the risk is high; an early warning with an update is better than a late, perfect account.

## 11. Transfers outside Nigeria

Some of our processors are outside Nigeria. The NDPA permits such a transfer only on a proper basis, and we rely on the following, in this order of preference:

1. **Adequacy** — where the Commission has determined the destination affords an adequate level of protection, or has approved binding corporate rules, standard contractual clauses or a certification mechanism for it.
2. **Contract necessity** — where the transfer is necessary to perform our contract with you, or to take steps you asked for before entering it (paying an invoice, delivering a lot, sending you an email you requested).
3. **Explicit consent with risk information** — where neither of the above applies, we rely on your consent given after you have been told about the possible risks of transferring to a country without an adequacy determination. This is the position for any transfer to a destination for which no adequacy decision exists, and we say so here rather than burying it.

We keep the mechanism used for each destination under review, and we do not transfer special-category data — identity documents — to a destination without an adequacy decision or appropriate safeguards in place.

## 12. Our Data Protection Officer

We have appointed a Data Protection Officer who is responsible for monitoring compliance with the NDPA, advising on impact assessments, cooperating with the Commission and acting as the contact point for you.

**Data Protection Officer** — privacy@greyauction.com

The DPO's details are also the contact point given to the Commission in our registration (§13). You can raise a concern with the DPO directly and without going through support.

## 13. Registration and accountability

Where we are a controller of **major importance** under the NDPA, we register with the Nigeria Data Protection Commission and notify it of significant changes to the information we registered. Our registration describes:

- our name and address, and the name and address of the Data Protection Officer;
- the categories of personal data and the number of data subjects concerned;
- the purposes of processing;
- the categories of recipient to whom data may be disclosed;
- the identity of processors acting for us;
- the countries to which data may be transferred;
- a general description of the risks, safeguards and security measures we apply.

In addition we maintain the record of processing (§4), run the assessments in §6, log breaches (§10), and review this statement at least annually and whenever a material change occurs.

## 14. Raising a concern

Contact the Data Protection Officer at **privacy@greyauction.com**, or open a Contact ticket marked "Data protection". Tell us what happened and what outcome you want; we will investigate and reply.

If we cannot resolve it to your satisfaction, you may complain to the **Nigeria Data Protection Commission**. You may also seek a civil remedy for damage caused by a breach of the Act. We will cooperate with the Commission and will not penalise you in any way for raising a concern or exercising a right.

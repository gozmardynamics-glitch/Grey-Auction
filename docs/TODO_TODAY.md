# GreyAuction — Today's Implementation Checklist

> Drawn from `docs/HANDOFF.md` ("Continue tomorrow" backlog) at session start.
> Living checklist — items are ticked and committed in priority order.
> Repo: `extracted/Grey-Auction-master` · branch `master` · 38+ commits ahead of `origin/master` (push awaiting explicit user go-ahead).

## 1. Deep dashboard detail i18n (biggest first)
- [x] **Buyer wallet flows** — deposit/withdraw modals + all step components, PIN flows, receipt.
  New namespaces: `buyer.wallet` (+ role-agnostic `wallet.addAccount` for the shared add-account steps
  also used by seller settings → payments). Verification: tsc → vitest → catalog parity (en/fr/nl) →
  Playwright probe with storageState asserting localized strings, no raw `ns.key` leaks, all 3 locales.
- [x] **Buyer settings tabs** — profile / security / notifications / payment (`buyer.settings.*`, 86 keys).
- [x] **Seller settings modules** — my-profile, store, fees-payouts, plan-packages, payments… (`seller.settings.*`, 173 keys, committed d8072e3).
- [ ] **Admin settings modules** — `fees.tsx` (heaviest file in the domain), general, preferences, roles… (`admin.settings.*`).
- [ ] **Admin list-table chrome** — auctions/bids/buyers/sellers/tickets headers + filter buttons
  (`admin.auctions`, `admin.bids`, … column-hook factories per Pattern 2).

## 2. EmptyState sweep
- [x] Buyer my-bids / purchases / wishlist tables — verified: `my_bids_table`, `purchases_table` pass contextual `emptyTitle`/`emptyDescription`; wishlist already renders the shared `EmptyState` (its literal strings join the buyer.wishlist i18n pass).
- [x] Seller listings / sales tables — verified: `listings_table`, `sales_view`, `seller_payments_table`, `bidding_room_view` all pass empty props.
- [x] Remaining admin tables → `DataTable` defaults to the shared `EmptyState` (`emptyTitle: 'No results found'` fallback); explicit contextual copy exists on the 26 audited tables except `audit_logs.tsx` (in the admin settings i18n pass) — contextual empty copy added to `seller/bidding-room` `auctions_step.tsx`.

## 3. Push authorization — ⏸ PENDING USER
- 38+ local commits ahead of `origin/master`; `git push` only on the user's explicit go-ahead.

## 4. OPay/Interswitch sandbox — ⏸ PENDING USER (vendor keys)
- Code-complete + unit-covered; webhooks fail closed until real `OPAY_*` / `INTERSWITCH_*` keys are provided.

## 5. Response-DTO pass (nice-to-have)
- [x] Known PII leaks fixed (participants, room creator); systematic DTO layer in place — shared `USER_PUBLIC_SELECT` projection (committed 35d1d47); room bid feed leak closed with regression test.

## 6. Listing fetch structural step
- [x] Server-side filtering + backend-served arm-tab counts — `GET /products/arm-counts` (d59fc8a) + URL-scoped server filtering and tabs wired to server counts (11e23b8); sidebar browsing keeps the instant full-set path.

## 7. Physical U5 test runbook
- [x] `docs/PHYSICAL_TEST_U5.md` reviewed/updated — added Phase 8 (OPay/Interswitch sandbox pass: env keys, provider status check, init/webhook steps, fail-closed tamper tests, audit records to capture).

## Bookkeeping (end of day)
- [ ] Update `docs/HANDOFF.md` checkpoint, `docs/PRODUCTION_AUDIT.md` ledger, `pendingwork.md` placeholders.
- [ ] Suites green: `npx tsc --noEmit` · `npx vitest run` · `npx playwright test` · backend `npx jest`.
- [ ] No generated logs / `test-results/` / temp SQL / auto-generated `AGENTS.md`/`CLAUDE.md` in any diff.

## Standing conventions (from handoff)
- Catalogs: edit via file tools or **node only** (never PS5.1 re-save); en/fr/nl strict parity; restart dev server after catalog edits.
- U5 invariants: don't break fee field-claiming, escrow auto-hold, or `POST /orders/buy-now/:productId`.
- Don't touch the two U5 test lots (category `'art'`, direct_sale) or the two draft lots.
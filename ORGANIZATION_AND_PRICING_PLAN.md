# Organization Sellers + Configurable Pricing — Plan & Workflow

> **Date:** 2026-08-12 | **Request:** Organizations (companies, firms, government, embassies) conduct auctions + configurable commission/VAT/charges visible to bidders

---

## 1. Exploration Findings

| Area | Current State | Gap |
|------|---------------|-----|
| Seller types | INDIVIDUAL, SOLE_PROPRIETORSHIP, LLC, CORPORATION, PARTNERSHIP | No AGENCY/GOVERNMENT/EMBASSY/NGO |
| Contact person | None (uses account name) | Needs dedicated contact_person field |
| Registration flows | 2 disconnected forms (auth + marketing), fields don't match DTO | Needs unified org workflow |
| Product controls | draft→pending_approval→approved→active→sold/expired/closed; reservePrice + hasReservePrice | No WITHDRAWN status, no reserve visibility (hidden/exposed) |
| Pricing | Hardcoded 19% auction fee + VAT stubs in bid modal & active card; seller commission_rate (10%) in DB | No configurable fee system |
| Settings | In-memory only, no entity | No persistent fee configuration |
| Admin fee UI | None (payments module = gateway only) | Needs Fees module |
| Checkout | Price + Total only | No breakdown |

---

## 2. Workflow Design

### 2.1 Organization Registration (New)
```
Organization visits /seller → selects "Organization / Government / Embassy"
  Step 1: Account — org email + password
  Step 2: Agency details — agency name, type (company/firm/government/embassy/ngo),
          registration number, contact person, email, phone, address
  Step 3: Auction intent — categories, estimated volume, consultant option
  Submit → Confirmation email → Platform review
  Platform reaches out (inquiry) → Confirmed → Account approved → Can list
```

### 2.2 Consultant Mode (New)
- Registration offers: "List myself" vs "Let Grey Auction list for you (free)"
- Consultant flag on seller; platform staff list items on behalf

### 2.3 Product Controls (Enhance)
- Publish/unpublish toggle
- Withdraw (new WITHDRAWN status)
- Reserve price with visibility: `hidden` | `exposed`

### 2.4 Configurable Pricing (New)
```
Admin configures per category:
  - Platform commission % (default 10)
  - VAT % (default 7.5)
  - Other charges % or fixed amount
  - Buyer premium % (default 0)
Bidder sees live breakdown in bid panel:
  Bid amount
  + Commission (x%)
  + VAT (y%)
  + Other charges (z or fixed)
  = Total payable
```

---

## 3. Implementation Tasks

### T1 — Backend: Fee configuration entity + API
- `fee-config.entity.ts`: category, commissionPct, vatPct, otherChargesPct, fixedFee, buyerPremiumPct, isActive
- `fee.service.ts` + `fee.controller.ts`: GET/PUT /fees, GET /fees/category/:cat, GET /fees/breakdown?amount=&category=
- Seed default config

### T2 — Backend: Organization seller type + product controls
- SellerBusinessType += AGENCY, GOVERNMENT, EMBASSY, NGO
- Seller += contact_person, consultant_listing flag, auction_visibility (public/private)
- Product += WITHDRAWN status; reservePriceVisibility (hidden/exposed)
- Org registration endpoint + confirmation email

### T3 — Frontend: Organization registration flow
- New /auth/organization/register multi-step wizard
- Update /seller landing page with organization option
- Consultant mode selector

### T4 — Frontend: Price breakdown everywhere
- Shared `PriceBreakdown` component (bid, commission, VAT, charges, total)
- Integrate in place_bid_modal, active_auction_card, checkout
- Fetch from /fees/breakdown

### T5 — Frontend: Admin fee configuration page
- Admin/settings Fees module with category table, sliders, fixed fee option

### T6 — Test end-to-end (seller + buyer)
- Register as organization → approve → list with reserve → bid with breakdown

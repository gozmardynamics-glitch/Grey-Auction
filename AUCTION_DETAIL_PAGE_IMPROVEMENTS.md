# Auction Detail Page — Improvement Plan
## Based on Troostwijk Auctions Analysis

> **Date:** 2026-08-12 | **Source:** Live analysis of troostwijkauctions.com item detail pages

---

## What Troostwijk Shows (When Clicking an Item)

### 1. Header/Breadcrumb Area
- Full breadcrumb: Home > Category > Subcategory > Item title
- Location with Google Maps link
- "Company seller" badge
- Lot ID (e.g., "A1-49133-963")
- Parent auction link (e.g., "Terberg Terminal tractor, forklift trucks and cleaning machines")
- Previous/Next lot navigation buttons

### 2. Image Gallery
- Large hero image (60% width)
- Image counter badge ("1 / 39")
- Favorite/heart icon with count ("80")
- Left/right navigation arrows
- "View all images" button at bottom center
- 20-40 photos per item

### 3. Lot Specifications Table (KEY FEATURE)
- Dark navy pill badge header: "LOT SPECIFICATIONS"
- Two-column key-value grid, no borders
- 13-20 structured specs:
  - Quantity, Margin, License Plate, Brand, Type
  - Year of build, Cylinder capacity, Mileage
  - Inspection expiration, First registration date
  - Transmission, Number of axles, Axle configuration
  - Fuel Type, Emission standard, Load capacity
  - Key count, Sleeper cab, Navigation, Own weight
  - Starting info, Nationality docs, Seat count

### 4. Bid Panel (Right Sidebar)
- "CLOSES IN:" with exact date/time (e.g., "25 Aug 2026 14:25")
- "CURRENT BID" with gavel icon + bid count ("10 bids")
- Large bold price
- Status badge ("Subject to allocation")
- "Sign in to bid" / "Create account" buttons (for logged-out users)
- Bid history table (3 visible rows):
  - Amount, Date, Bidder (numbered badges for anonymity)
  - "View all bids" button
- "Have questions?" help link

### 5. Description Sections (Stacked)
- **DESCRIPTION** badge → Text content
- **REMARKS** badge → Important condition notes
- **ADDITIONAL DETAILS** badge → Terms, pickup info, storage fees

### 6. Legal Information
- **LEGAL INFORMATION** badge
- "No warranty applicable"
- "Right of withdrawal applicable to consumers"
- "Troostwijk is not the seller, but auctions as an intermediary"

### 7. Collection/Pickup Info
- **COLLECTION** section with:
  - Address with country flag
  - Specific date/time window (e.g., "Tue, Sep 01, 2026 from 08:00 until 11:00")
  - Note about fixed dates and storage fees
- **VIEWINGS** section with:
  - Same address
  - Viewing date/time window

### 8. CO2 Savings Badge
- Environmental impact metric (e.g., "61,146 kg CO₂e")
- Explanation: "carbon emissions saved by purchasing pre-owned"

### 9. Related Items (Two Carousels)
- **"Recommended for you"** — Personalized suggestions
- **"More from the same auction"** — Contextual items from same seller/auction
- Each card: image + favorite badge + countdown + lot ID + title + location + bid count + price

---

## Gap Analysis: Grey Auction vs Troostwijk

| Feature | Troostwijk | Grey Auction | Priority |
|---------|-----------|-------------|----------|
| Breadcrumbs | Full path | Implemented | **DONE** |
| Location + Map link | City, Country + Google Maps | Basic location | **HIGH** |
| Seller badge | "Company seller" | Seller name | **MEDIUM** |
| Lot ID | Unique lot number | Lot # shown | **DONE** |
| Parent auction link | Link to auction collection | Not shown | **HIGH** |
| Previous/Next lot nav | Navigate between lots | Not available | **HIGH** |
| Image counter | "1 / 39" badge | Not shown | **MEDIUM** |
| Favorite count | Heart + "80" count | Heart only | **MEDIUM** |
| "View all images" button | Bottom center pill | Not shown | **MEDIUM** |
| **Lot specifications table** | 13-20 structured specs | Basic description | **CRITICAL** |
| **Remarks section** | Separate section | Not separate | **HIGH** |
| **Legal information** | Dedicated section | In tabs (empty) | **HIGH** |
| **Collection/Pickup info** | Address + dates + times | Not shown | **HIGH** |
| **CO2 savings badge** | Environmental metric | Not shown | **LOW** |
| Bidder anonymity | Numbered badges | Full names shown | **MEDIUM** |
| "View all bids" button | Expandable | Full table shown | **LOW** |
| Two related carousels | Recommended + Same auction | One carousel | **MEDIUM** |
| Help section | "Have questions?" link | Not shown | **LOW** |

---

## Implementation Plan (Priority Order)

### Phase 1: Critical (Must Have)
1. **Lot Specifications Table** — Structured key-value specs with navy pill header
2. **Remarks Section** — Important condition notes
3. **Legal Information Section** — Terms, warranty, intermediary disclosure

### Phase 2: High Priority
4. **Collection/Pickup Section** — Address, dates, times, storage fees
5. **Parent Auction Link** — "Part of X auction" with link
6. **Previous/Next Lot Navigation** — Browse between items
7. **Location with Map Link** — Clickable Google Maps link

### Phase 3: Medium Priority
8. **Image Counter Badge** — "1 / 39" overlay
9. **Favorite Count** — Heart + number
10. **"View all images" Button** — Bottom center pill
11. **Bidder Anonymity** — Numbered badges instead of names
12. **Two Related Carousels** — Recommended + Same auction

### Phase 4: Nice to Have
13. **CO2 Savings Badge** — Environmental impact
14. **Help Section** — "Have questions?" link
15. **Collection Date Warning** — Fixed dates, storage fees

---

## Files to Modify

1. `app/[locale]/(website)/auctions/[slug]/product_details_client.tsx` — Main layout
2. `app/[locale]/(website)/auctions/[slug]/product_tabs_content.tsx` — Tab content
3. `app/[locale]/(website)/auctions/[slug]/components/auction_details_grid.tsx` — Specs grid
4. `app/[locale]/(website)/auctions/[slug]/components/auction_sale_info.tsx` — Sale info
5. `app/[locale]/(website)/auctions/[slug]/components/bid_history_table.tsx` — Bid history
6. `app/[locale]/(website)/auctions/[slug]/components/image_gallery.tsx` — Gallery
7. `app/[locale]/(website)/models/index.ts` — Data models

---

## Key Design Patterns from Troostwijk

1. **Dark navy pill badges** (#1a2b4a) with white text for section headers
2. **Two-column key-value grid** with no borders, just spacing
3. **Numbered bidder badges** (blue circles with white numbers) for anonymity
4. **Countdown overlays** on images (semi-transparent dark pills)
5. **Orange accent** for interactive/favorite elements
6. **Navy blue primary** for CTAs and headings
7. **Clean, utilitarian design** — function over decoration

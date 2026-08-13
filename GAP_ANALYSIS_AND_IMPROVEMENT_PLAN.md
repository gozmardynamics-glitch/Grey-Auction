# Grey Auction — Gap Analysis & Improvement Plan
## Benchmark: Troostwijk Auctions (troostwijkauctions.com)

> **Date:** 2026-08-12 | **Analysis based on:** Live site review of Troostwijk Auctions + Grey Auction codebase audit

---

## 1. Executive Summary

Troostwijk Auctions is a 95-year-old industrial auction platform with 300,000+ active buyers, 436+ live auctions, and operations across 20+ European countries. Grey Auction is a Nigerian-focused auction platform with solid foundations (25 commits, 40+ pages, 72 tests) and significant existing infrastructure. After deep codebase exploration, we found that many features marked as "missing" actually exist but need **polish and enhancement** rather than building from scratch. This document identifies **35 specific improvement areas** across 8 categories, prioritized by impact.

---

## 2. Feature Gap Analysis

### 2.1 HOMEPAGE & DISCOVERY

| Feature | Troostwijk | Grey Auction | Gap Status |
|---------|-----------|-------------|------------|
| Hero section with live auction previews | Multi-image cards with lot count, location, closing time | Basic featured auctions carousel | **NEEDS UPGRADE** |
| "Trending lots" section | Dedicated section with lot images, lot IDs, locations, bid counts | **EXISTS** — `trending_lots/trending_lots.tsx` with category filter | **NEEDS UPGRADE** — Add location, lot IDs, bid counts |
| "New auctions: now open" section | Dedicated CTA section with 4-image previews | Missing entirely | **MISSING** |
| Auction status indicators | "Closing soon", "Closing later", "Starting soon" tabs | Basic status filter tabs (done) | **PARTIAL** |
| Location display on cards | City + Country flag on every card | Not shown on cards | **MISSING** |
| Lot count per auction | Badge showing number of lots (e.g., "525 lots") | Not displayed | **MISSING** |
| Multi-image preview on cards | 4 thumbnail images stacked on auction cards | Single image per card | **NEEDS UPGRADE** |
| Testimonials section | Video-style testimonials with photos, names, company, industry | **EXISTS** — `customer_stories.tsx` on homepage | **NEEDS UPGRADE** — Add photos, company names, industries |
| Seller statistics banner | "300,000+ buyers, 10,000+ sellers, 10M+ bids" | Missing entirely | **MISSING** |
| Auction advisor map | Interactive map showing local auction advisors | Missing entirely | **MISSING** |
| Currency exchange rates | "Exchange rates updated daily" with multi-currency | Single currency (NGN) | **MISSING** |
| Category mega-menu | Full-width dropdown with 30+ categories, subcategories, icons | Basic category links | **NEEDS UPGRADE** |

### 2.2 AUCTION LISTING & BROWSING

| Feature | Troostwijk | Grey Auction | Gap Status |
|---------|-----------|-------------|------------|
| Sort options | Closing soon, Closing later, Starting soon, Starting later | Basic sort | **NEEDS UPGRADE** |
| Country filter | 20+ countries with count badges | Not available | **MISSING** |
| Closing time calendar filter | Interactive calendar picker | Not available | **MISSING** |
| Auction status filter | Future/Current/Closed tabs | Basic tabs (done) | **PARTIAL** |
| Multi-image auction cards | 4 stacked thumbnails per card | Single image | **NEEDS UPGRADE** |
| Lot count badge | Number overlay on card image | Not shown | **MISSING** |
| Location with country flag | City, Country with flag icon | Not displayed | **MISSING** |
| Auction grouping by date | "Today 12 Aug 26" date headers | Flat list | **MISSING** |
| "Direct sales" section | Separate section for fixed-price sales | Not available | **MISSING** |
| Bulk lot display | "525 lots in this auction" with grid view | Single lot view only | **MISSING** |

### 2.3 ITEM/LOT DETAIL PAGE

| Feature | Troostwijk | Grey Auction | Gap Status |
|---------|-----------|-------------|------------|
| High-res image gallery | Full-screen lightbox with zoom | Gallery carousel (done) | **PARTIAL** |
| Lot number display | Unique lot ID (e.g., "A1-49080-9") | Not shown | **MISSING** |
| Specifications table | Structured technical specs (year, make, model, condition) | Basic description text | **NEEDS UPGRADE** |
| Bid history | Real-time bid log with timestamps | **EXISTS** — `bid_history_table.tsx` in auction detail | **NEEDS UPGRADE** — Add timestamps, bidder names |
| Similar lots | "Other lots in this auction" section | **EXISTS** — Related lots section in auction detail | **NEEDS UPGRADE** — Show more context |
| Seller info on lot page | Seller name, rating, location | Minimal seller info | **NEEDS UPGRADE** |
| Condition report | Detailed condition description with photos | Not available | **MISSING** |
| Transport/delivery options | "Request transport quote" button | Not available | **MISSING** |
| Watchlist/favorites | Heart icon to save items | Wishlist page exists | **PARTIAL** |
| Share buttons | Social share (done) | Implemented | **DONE** |
| Countdown timer | DD:HH:MM:SS (done) | Implemented | **DONE** |

### 2.4 SELLER EXPERIENCE

| Feature | Troostwijk | Grey Auction | Gap Status |
|---------|-----------|-------------|------------|
| Seller landing page | Dedicated "Sell with us" page with 3-step process | **EXISTS** — `/(seller)/seller` with Hero, HowItWorks, TrustedBrands, CustomerStories, SellerFaq, SellerCta | **NEEDS UPGRADE** — Add statistics, advisor photos |
| Seller statistics | "10,000+ sellers have sold before you" | Not displayed on landing page | **MISSING** |
| Auction advisors | Named advisors with photos, regions, contact | Not available | **MISSING** |
| Seller testimonials | Video-style with photos, company names, quotes | **EXISTS** — CustomerStories component | **NEEDS UPGRADE** — Add photos, company names |
| Managed service description | "We take photos, describe items, handle bidding" | Not available | **MISSING** |
| Seller dashboard analytics | Revenue charts, auction performance, bid analytics | **EXISTS** — Stats cards, revenue, listed auctions | **NEEDS UPGRADE** — Add charts, performance trends |
| Seller profile page | Public profile with ratings, reviews, auction history | Basic seller info | **NEEDS UPGRADE** |
| Seller verification badges | Verified/Approved status badges | KYC system exists | **PARTIAL** |
| Payout management | Multiple payout methods (Bank, Mobile Money, Crypto) | Stub exists | **NEEDS UPGRADE** |

### 2.5 BUYER EXPERIENCE

| Feature | Troostwijk | Grey Auction | Gap Status |
|---------|-----------|-------------|------------|
| Buyer dashboard | Bid history, won items, watchlist, account settings | **EXISTS** — Single-page dashboard with 12 tab modules (dashboard, account, auctions, chats, messages, my_bids, notifications, purchases, settings, wallet, wishlist, authentications) | **NEEDS UPGRADE** — Enhance visual design, add performance charts |
| Bid tracking | Real-time bid updates, outbid notifications | **EXISTS** — WebSocket gateway + Redux bidding slice | **DONE** |
| Won items management | Payment, pickup/delivery scheduling | **EXISTS** — Purchases tab with purchase detail | **NEEDS UPGRADE** — Add delivery scheduling |
| Buyer protection | Escrow, dispute resolution | Not available | **MISSING** |
| Transport/delivery quotes | "Request transport" integrated | Not available | **MISSING** |
| Bid tips | "5 tips to win at an auction" guide | Not available | **MISSING** |
| Account settings | Profile, payment methods, notifications, security | **EXISTS** — Settings tab with profile, security, notifications, payment | **NEEDS UPGRADE** — Polish UI |
| Order history | Past purchases with status tracking | **EXISTS** — Purchases tab with table | **NEEDS UPGRADE** — Add status tracking timeline |

### 2.6 NAVIGATION & SEARCH

| Feature | Troostwijk | Grey Auction | Gap Status |
|---------|-----------|-------------|------------|
| Global search bar | Prominent search with autocomplete | Basic search | **NEEDS UPGRADE** |
| Category mega-menu | 30+ categories with subcategories in dropdown | Basic nav links | **NEEDS UPGRADE** |
| Breadcrumbs | Category > Subcategory > Item breadcrumbs | Implemented (done) | **DONE** |
| Language switcher | 7 languages (EN, NL, FR, PL, DE, IT, RO) | 3 locales (EN, FR, NL) | **PARTIAL** |
| Mobile menu | Hamburger with full category tree | Mobile menu exists | **PARTIAL** |
| Footer sitemap | Organized footer with 5 link columns | Basic footer | **NEEDS UPGRADE** |

### 2.7 TRUST & CREDIBILITY

| Feature | Troostwijk | Grey Auction | Gap Status |
|---------|-----------|-------------|------------|
| Company history | "95 years" badge, "Our Story" page | About Us page exists | **PARTIAL** |
| Social proof numbers | "300K+ buyers, 10K+ sellers, 10M+ bids" | Not displayed | **MISSING** |
| Customer testimonials | Named individuals with photos, companies, industries | Not available | **MISSING** |
| Payment method logos | iDEAL, Bancontact, Card, Przelewy24 | Not displayed | **MISSING** |
| Social media links | Facebook, Instagram, LinkedIn | Not displayed | **MISSING** |
| FAQ/Help center | Dedicated help center (service.troostwijkauctions.com) | FAQ page exists | **PARTIAL** |
| News/Blog section | News subdomain with articles | Blog page exists | **PARTIAL** |
| Release notes | Public changelog | Not available | **MISSING** |
| Careers page | External careers site | Career page exists | **PARTIAL** |
| Accessibility statement | Dedicated accessibility page | Not available | **MISSING** |

### 2.8 STYLING & DESIGN QUALITY

| Aspect | Troostwijk | Grey Auction | Recommendation |
|--------|-----------|-------------|----------------|
| Color scheme | Professional dark header (#1a1a2e), white body, orange accents | Grey theme with orange accents | Refine to more professional palette |
| Typography | Clean sans-serif, clear hierarchy | System fonts (good) | Add font weight hierarchy |
| Card design | Multi-image stacked, location badge, lot count | Single image, basic info | Upgrade to multi-image cards |
| Spacing | Generous whitespace, clear sections | Adequate | Add more breathing room |
| Loading states | Skeleton loaders, smooth transitions | Basic | Add skeleton states |
| Empty states | Helpful illustrations + CTAs | Basic | Add illustrations |
| Mobile responsiveness | Fully responsive, touch-optimized | Needs audit | Responsive pass needed |

---

## 3. Priority Implementation Workflow

### Phase 1: Quick Wins (1-2 days)
**Goal:** Immediate visual parity with Troostwijk

1. **Homepage Trust Section** — Add "300,000+ buyers, 10,000+ sellers" statistics banner
2. **Testimonials Section** — Add customer testimonials carousel on homepage
3. **Social Proof Numbers** — Add statistics to hero/about sections
4. **Payment Method Logos** — Add Flutterwave/Paystack logos to footer
5. **Social Media Links** — Add Facebook, Twitter, Instagram, LinkedIn to footer
6. **Multi-Image Auction Cards** — Show 2-4 thumbnail images per auction card

### Phase 2: Discovery & Browsing (3-5 days)
**Goal:** Make finding auctions effortless

7. **Trending Lots Section** — New homepage section showing popular items
8. **New Auctions Section** — "Now Open" section with preview cards
9. **Location Display** — Show city + country on all auction cards
10. **Lot Count Badge** — Show number of lots per auction
11. **Category Mega-Menu** — Full-width dropdown with 30+ categories
12. **Advanced Sort Options** — Closing soon/later, Starting soon/later
13. **Country Filter** — Filter auctions by location
14. **Closing Time Calendar** — Interactive date picker for filtering

### Phase 3: Item Detail Enhancement (3-5 days)
**Goal:** Rich lot detail pages that drive bids

15. **Lot Number System** — Unique lot IDs (e.g., "GA-2026-001-001")
16. **Specifications Table** — Structured technical specs (year, make, model, condition)
17. **Bid History Panel** — Real-time bid log with timestamps and amounts
18. **Similar Lots Section** — "Other items in this auction" carousel
19. **Condition Report** — Detailed condition description with photos
20. **Transport Quote** — "Request delivery" button/modal
21. **Seller Info Card** — Enhanced seller info on lot detail page

### Phase 4: Seller Experience (5-7 days)
**Goal:** Make selling frictionless and professional

22. **Seller Landing Page** — Dedicated "Sell with us" page (like Troostwijk)
23. **3-Step Selling Process** — Clear onboarding flow
24. **Seller Testimonials** — Video-style testimonials from sellers
25. **Seller Statistics Dashboard** — Revenue charts, auction performance
26. **Seller Public Profile** — Enhanced profile with ratings, reviews, history
27. **Auction Advisor System** — Named advisors with regions (for larger sellers)
28. **Managed Service Option** — "We handle everything" service tier

### Phase 5: Buyer Experience (5-7 days)
**Goal:** Keep buyers coming back

29. **Enhanced Buyer Dashboard** — Bid history, won items, watchlist
30. **Won Items Management** — Payment flow, pickup/delivery scheduling
31. **Order History** — Past purchases with status tracking
32. **Bid Tips Guide** — "How to win at auction" educational content
33. **Notification Center** — Centralized bid/outbid/win notifications
34. **Account Settings Enhancement** — Payment methods, notification preferences

### Phase 6: Navigation & Search (3-5 days)
**Goal:** Find anything in 2 clicks

35. **Global Search Enhancement** — Autocomplete, recent searches, suggestions
36. **Category Tree Restructuring** — 30+ categories with subcategories
37. **Footer Sitemap** — Organized 5-column footer with all links
38. **Language Expansion** — Add German, Spanish, Arabic locales
39. **Accessibility Statement** — WCAG 2.1 AA compliance page

### Phase 7: Trust & Polish (3-5 days)
**Goal:** Professional credibility

40. **Company History Page** — "Our Story" with timeline
41. **Release Notes Page** — Public changelog
42. **News/Blog Enhancement** — Regular content publishing
43. **Mobile Responsive Audit** — Fix all responsive issues
44. **Loading/Empty/Error States** — Skeleton loaders, helpful empty states
45. **SEO Enhancement** — Schema.org for auctions, sitemap updates

### Phase 8: Advanced Features (7-14 days)
**Goal:** Competitive differentiation

46. **Direct Sales Section** — Fixed-price sales alongside auctions
47. **Multi-Currency Support** — NGN, USD, GBP, EUR with daily rates
48. **Bulk Lot Upload** — CSV upload for multiple items
49. **AI Description Generator** — Generate lot descriptions from photos
50. **Smart Search** — Semantic search with pgvector

---

## 4. Styling Recommendations (Based on Troostwijk)

### Color Palette Refinement
```
Primary Dark:    #1B2A4A (deep navy, professional)
Primary:         #E85D2C (vibrant orange, auction energy)
Secondary:       #2D3748 (dark grey for text)
Accent:          #38B2AC (teal for success states)
Background:      #F7FAFC (light grey, clean)
Surface:         #FFFFFF (white cards)
Text Primary:    #1A202C (near-black)
Text Secondary:  #718096 (medium grey)
```

### Card Design Pattern (Troostwijk-style)
```
┌─────────────────────┐
│ ┌─────┐ ┌─────┐     │  ← Multi-image stack (4 thumbnails)
│ │ IMG │ │ IMG │     │
│ └─────┘ └─────┘     │
│ ┌─────┐ ┌─────┐     │
│ │ IMG │ │ IMG │     │
│ └─────┘ └─────┘     │
│                     │
│ 525 lots  │  Berlin, DE  │  ← Lot count + Location
│                     │
│ Auction Title       │  ← Title
│ Closing: 2h 34m     │  ← Countdown
│ Current Bid: ₦50,000│  ← Bid amount
└─────────────────────┘
```

### Typography Hierarchy
```
H1: 2.5rem / Bold / #1A202C
H2: 2rem / Semibold / #1A202C
H3: 1.5rem / Semibold / #2D3748
Body: 1rem / Regular / #4A5568
Small: 0.875rem / Regular / #718096
Caption: 0.75rem / Medium / #A0AEC0
```

---

## 5. Implementation Order (Recommended)

| Week | Focus | Tasks | Impact |
|------|-------|-------|--------|
| Week 1 | Quick Wins + Discovery | Tasks 1-14 | High visual impact, low effort |
| Week 2 | Item Detail + Seller | Tasks 15-28 | Core auction experience |
| Week 3 | Buyer + Navigation | Tasks 29-39 | Retention + usability |
| Week 4 | Trust + Polish | Tasks 40-45 | Credibility + quality |
| Week 5-6 | Advanced | Tasks 46-50 | Competitive edge |

---

## 6. What We Already Have (Don't Remove)

### Homepage
- ✅ Hero banner carousel with category/featured/slide types
- ✅ Featured auctions section
- ✅ Featured active auctions with countdown timers
- ✅ Categories carousel with cards
- ✅ Featured cosmetics auctions section
- ✅ Trending lots with category filter
- ✅ Join Auction CTA section
- ✅ Trusted Brands logo carousel
- ✅ Customer Stories (testimonials)
- ✅ Join Marketplace (seller CTA)

### Auction Features
- ✅ Image gallery carousel with lightbox
- ✅ Live countdown timer (DD:HH:MM:SS)
- ✅ Auction status filter tabs
- ✅ Social share buttons
- ✅ Auto-bid UI with maximum/automatic bid modes
- ✅ Bid history table
- ✅ Related lots section
- ✅ Place bid modal with confirm/success steps
- ✅ Live auction card (WebSocket real-time)
- ✅ Active auction card with bid placement
- ✅ Wishlist functionality
- ✅ Newsletter signup form
- ✅ Seller rating stars
- ✅ Category breadcrumbs
- ✅ Auction scheduling with timezone
- ✅ SEO (sitemap, robots.txt, Schema.org structured data)

### Seller System
- ✅ Seller landing page (Hero, HowItWorks, TrustedBrands, CustomerStories, SellerFaq, SellerCta)
- ✅ 3-step seller registration (Personal, Business, Auction details)
- ✅ Seller dashboard with stats cards, revenue, listed auctions
- ✅ Create listing with 4-step stepper (Auction Details, Lot & Inventory, Pricing & Terms, Review)
- ✅ Bidding room management (create room, invite bidders, participants)
- ✅ Sales management with receipt modal
- ✅ Payment/Payout system with balance, withdraw, stats
- ✅ Seller settings (9 modules: Profile, Notifications, Payments, Preferences, Security, Plans, Store, Contact)
- ✅ Seller KYC system with document upload

### Buyer System
- ✅ Buyer dashboard with 12 tab modules
- ✅ My Bids tracking
- ✅ Purchases with detail view
- ✅ Wallet with deposit/withdraw, payment table, receipt
- ✅ Chat/Messaging system
- ✅ Notifications center
- ✅ Wishlist management
- ✅ Account settings (Profile, Security, Notifications, Payment)

### Technical
- ✅ Next.js 16 with React 19, Tailwind CSS 4, Redux Toolkit
- ✅ WebSocket real-time bidding
- ✅ JWT auth + OTP verification
- ✅ i18n (EN, FR, NL) with 170+ keys each
- ✅ NextAuth.js with Credentials + Google OAuth
- ✅ AI chatbot integration
- ✅ Admin dashboard with AI/Agent management (providers, features, models, usage, agents, workflows, tools, monitoring)
- ✅ 68 shared UI components (shadcn/ui based)
- ✅ RTK Query API layer with caching

---

## 7. Key Takeaways

1. **We have more than we thought** — Codebase exploration revealed extensive existing infrastructure: trending lots, customer stories, bid history, related lots, seller landing page, buyer dashboard with 12 tabs, wallet system, AI chatbot. The gap is **polish and enhancement**, not building from scratch.

2. **Trust signals are Troostwijk's biggest weapon** — Numbers (300K+ buyers), testimonials with photos, 95-year history, payment method logos. Grey Auction has customer stories but needs more visual trust signals.

3. **Multi-image cards are standard** — Every Troostwijk auction card shows 4 stacked images. Our cards need this upgrade for visual density.

4. **Location is critical** — Every Troostwijk item shows city + country. Our cards don't show location — this is a quick win.

5. **Category mega-menu matters** — 30+ categories with subcategories in a full-width dropdown. Our flat nav needs upgrading.

6. **Seller experience drives supply** — Troostwijk's "We handle everything" managed service removes seller friction. We have the landing page but need the managed service messaging.

7. **Professional polish wins** — Clean typography, generous whitespace, consistent spacing. Small details compound into trust.

8. **Our existing features need enhancement, not replacement** — The trending lots section exists but needs location/bid counts. Customer stories exist but need photos/company names. Buyer dashboard exists but needs visual polish.

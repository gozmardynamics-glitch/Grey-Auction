# Plan: 5-Card Grid + 40% Timer Font Reduction

## Goal
1. Change all auction card grids to display 5 columns at `xl:` breakpoint (responsive: 1 → 2 → 3 → 5 cols as screen grows)
2. Reduce countdown timer font sizes by exactly 40% across all card components

## Files to Modify

### Part A: Grid Changes (5 columns at xl+, responsive below)

**1. `frontend/app/[locale]/(website)/components/featured_auctions/featured_auctions.tsx`**
- Line 76: `const itemsPerPage = 8;` → `const itemsPerPage = 10;` (5 cols × 2 rows)
- Line 102: `xl:grid-cols-4` → `xl:grid-cols-5`

**2. `frontend/app/[locale]/(website)/components/trending_lots/trending_lots.tsx`**
- Line 63: `xl:basis-1/4` → `xl:basis-1/5`

**3. `frontend/app/[locale]/(website)/components/related_lots/related_lots.tsx`**
- Line 64: `xl:basis-1/4` → `xl:basis-1/5`

**4. `frontend/app/[locale]/(website)/components/categories/categories_carousel.tsx`**
- Line 118: `xl:grid-cols-4` → `xl:grid-cols-5`

**5. `frontend/app/[locale]/(website)/auctions/auction_listing_client.tsx`**
- Line 284: `xl:grid-cols-4` → `xl:grid-cols-5`

---

### Part B: Timer Font Reduction (40% smaller)

| Original Class | Original Size | 40% Reduction | New Class |
|---|---|---|---|
| `text-sm` | 14px (0.875rem) | 8.4px | `text-[8px]` |
| `text-xs` | 12px (0.75rem) | 7.2px | `text-[7px]` |
| `text-[10px]` | 10px | 6px | `text-[6px]` |

**6. `frontend/app/[locale]/(website)/components/featured_auctions/auction_card.tsx`**
- **Grid view** (line 255): `text-sm` → `text-[8px]`
- **List view** (line 128): `text-[10px]` → `text-[6px]`, `sm:text-xs` → `sm:text-[7px]`

**7. `frontend/app/[locale]/(website)/components/trending_lots/trending_lots_cards.tsx`**
- Line 130: `text-sm` → `text-[8px]`

**8. `frontend/app/[locale]/(website)/components/categories/categories_card.tsx`**
- Line 104 (label wrapper): `text-[10px] md:text-xs` → `text-[6px] md:text-[7px]`
- Line 106 (digit): `text-xs md:text-sm` → `text-[7px] md:text-[8px]`
- Line 113 (digit): `text-xs md:text-sm` → `text-[7px] md:text-[8px]`
- Line 120 (digit): `text-xs md:text-sm` → `text-[7px] md:text-[8px]`

---

## Validation
1. After changes, confirm dev server hot-reloads
2. Navigate to `http://localhost:3001/en` in Playwright
3. Verify categories section shows 5 per row at full width
4. Scroll down to Featured Auctions, Trending Auctions — verify 5 cols at xl+
5. Verify timer text is visibly smaller on all cards

## Risk
- 8px/7px/6px timer text is very small — borderline legible. If too small in practice, can bump to `text-[10px]` / `text-[9px]`.

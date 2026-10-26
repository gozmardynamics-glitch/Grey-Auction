import { getToken } from 'next-auth/jwt';
import { headers } from 'next/headers';
import { cache } from 'react';
import type { Auction } from '@/app/[locale]/(website)/models';

// Typed server-data boundary: each getter below asserts the entity shape its
// consumers (admin/seller/website pages) render with.
import type {
  Admin as AdminUser,
  Auction as AdminAuction,
  Banner as AdminBanner,
  Bid as AdminBid,
  BiddingRoom as AdminBiddingRoom,
  Buyer as AdminBuyer,
  Category as AdminCategory,
  Faq as AdminFaq,
  Payment as AdminPayment,
  Seller as AdminSeller,
  Ticket as AdminTicket,
} from '@/app/[locale]/(domain)/admin/models';
import type {
  BiddingRoom as SellerBiddingRoom,
  Conversation as SellerConversation,
  Sale as SellerSale,
} from '@/app/[locale]/(domain)/seller/models';
import type { Category as WebsiteCategory } from '@/app/[locale]/(website)/models';

import { SERVER_API_BASE } from '@/lib/api-base';

const API_BASE = SERVER_API_BASE;

/**
 * Per-request backend bearer token, read from the Auth.js JWT server-side.
 *
 * Deliberately NOT from `auth()`: the session object is client-readable, so it
 * no longer carries the token (5.6). The encrypted JWT cookie is HTTP-only, and
 * only server code can decode it. Cached per request so a render performs at
 * most one decode.
 */
const getSessionToken = cache(async (): Promise<string | null> => {
  try {
    const incoming = await headers();
    const jwt = await getToken({
      // getToken reads the cookie header; NextRequest/Headers both work.
      req: { headers: incoming } as unknown as Parameters<typeof getToken>[0]['req'],
      secret: process.env.AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });
    return (jwt as { accessToken?: string } | null)?.accessToken || null;
  } catch {
    return null;
  }
});

/**
 * Server-side fetch with the Auth.js session token attached when present,
 * so admin/seller endpoints (JWT-guarded) return real data for the
 * authenticated request that rendered the page.
 */
async function apiFetch(path: string, options?: RequestInit): Promise<unknown> {
  try {
    const token = await getSessionToken();
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
      ...options,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

/**
 * Like apiFetch, but returns the whole JSON envelope instead of unwrapping
 * `data`. Endpoints that paginate put `total` / aggregates alongside `data`,
 * and `data` alone would drop them.
 */
async function apiFetchEnvelope(
  path: string,
  options?: RequestInit,
): Promise<Record<string, unknown> | null> {
  try {
    const token = await getSessionToken();
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
      ...options,
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Normalize a backend Product row into the frontend Auction shape so
 * cards/detail pages render real data (images, location, counts...).
 */
interface RawAuction {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  images?: string[];
  status?: string;
  currentBid?: number;
  startingBid?: number;
  totalBids?: number;
  endTime?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  sellerId?: string;
  auctionType?: string;
  watchersCount?: number;
  hasReservePrice?: boolean;
  reservePrice?: number | string;
  specifications?: Record<string, unknown>;
  seller?: {
    business_name?: string;
    name?: string;
    rating?: number;
    reviewCount?: number;
  };
}

function normalizeAuction(p: unknown): Auction {
  const raw = p as RawAuction;
  const images = Array.isArray(raw?.images) && raw.images.length ? raw.images : ['/placeholder.svg'];
  // Map the real backend status through (5.12) instead of collapsing
  // everything to sold|active, which made the card's live/new branches dead.
  const STATUS_MAP: Record<string, Auction['status']> = {
    active: 'active',
    approved: 'new',
    sold: 'sold',
    closed: 'ended',
    expired: 'ended',
    awaiting_seller_approval: 'ended',
    // Non-public states should never reach a public grid; if legacy data
    // leaks one in, it is not bid-able — never render it as active.
    draft: 'ended',
    pending_approval: 'ended',
    rejected: 'ended',
    withdrawn: 'ended',
  };
  const status: Auction['status'] = STATUS_MAP[raw?.status ?? ''] ?? 'ended';
  return {
    id: raw?.id || '',
    slug: raw?.slug || raw?.id,
    title: raw?.title || '',
    description: raw?.description || '',
    category: raw?.category || '',
    subCategory: raw?.subCategory || '',
    images,
    imageUrl: images[0],
    currentBid: Number(raw?.currentBid ?? raw?.startingBid ?? 0),
    startingBid: Number(raw?.startingBid ?? 0),
    totalBids: Number(raw?.totalBids ?? 0),
    timeLeft: '',
    endTime: raw?.endTime ? new Date(raw.endTime) : new Date(Date.now() + 7 * 86400000),
    endTimeIso: raw?.endTime,
    status,
    location: raw?.city
      ? { city: raw.city, country: raw.country || 'Nigeria', countryCode: raw.countryCode || 'NG' }
      : undefined,
    sellerId: raw?.sellerId || '',
    sellerName: raw?.seller?.business_name || raw?.seller?.name || '',
    auctionType: raw?.auctionType === 'direct_sale' ? 'buy' : 'bid',
    specs: raw?.specifications
      ? Object.entries(raw.specifications)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ')
      : undefined,
    watchersCount: Number(raw?.watchersCount ?? 0),
    hasReservePrice: Boolean(raw?.hasReservePrice),
    reservePrice:
      raw?.reservePrice != null && Number.isFinite(Number(raw.reservePrice))
        ? Number(raw.reservePrice)
        : undefined,
    specifications: raw?.specifications
      ? Object.fromEntries(
          Object.entries(raw.specifications).map(([k, v]) => [k, String(v)]),
        )
      : undefined,
    rating: Number(raw?.seller?.rating ?? 0),
    reviewCount: Number(raw?.seller?.reviewCount ?? 0),
  };
}

/**
 * Products are owned by a User while KYC lives on the separate Seller record,
 * so the trust tier cannot be read off the listing payload. Resolve it in one
 * batch call per grid (chunked to the endpoint's 100-id limit) rather than one
 * request per card.
 *
 * The route is /seller-badges rather than /sellers/badges: SellerController
 * owns @Get(':id'), so a sibling static segment under /sellers is shadowed.
 */
async function attachSellerBadges(auctions: Auction[]): Promise<Auction[]> {
  const userIds = [...new Set(auctions.map((a) => a.sellerId).filter(Boolean))];
  if (userIds.length === 0) return auctions;

  const tiers: Record<string, string | null> = {};
  for (let i = 0; i < userIds.length; i += 100) {
    const chunk = userIds.slice(i, i + 100);
    const data = await apiFetch(
      `/seller-badges?userIds=${chunk.map(encodeURIComponent).join(',')}`,
    );
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      Object.assign(tiers, data as Record<string, string | null>);
    }
  }

  return auctions.map((auction) => {
    const tier = tiers[auction.sellerId];
    return {
      ...auction,
      sellerBadge:
        tier === 'verified' || tier === 'trusted' ? tier : null,
    };
  });
}

/**
 * Unwrap the many list shapes the API returns into a plain array.
 *
 * The API uses at least three: a bare array, `{ data: [...] }`, and the
 * paginated `{ success, data: { items: [...], total } }`. Only the first two
 * were handled, so every nested list (a seller's own lots among them) came back
 * empty while the endpoint was returning rows.
 */
function unwrapList(data: unknown): unknown[] | null {
  if (!data) return null;
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null) {
    const record = data as { items?: unknown; data?: unknown };
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.data)) return record.data;
    if (record.data && typeof record.data === 'object') {
      const nested = record.data as { items?: unknown; data?: unknown };
      if (Array.isArray(nested.items)) return nested.items;
      if (Array.isArray(nested.data)) return nested.data;
    }
  }
  return null;
}

// ─── Inline Mock Data ─────────────────────────────────────────────────────

const now = new Date();
const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const isoSevenDays = sevenDaysFromNow.toISOString();
const isoDay1 = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString();
const isoDay3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
const isoDay5 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
const isoDay10 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
const isoDay14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

const mockAuctions: Auction[] = [
  {
    id: 'auc-001',
    slug: '2022-toyota-camry-hybrid',
    title: '2022 Toyota Camry Hybrid',
    description: 'Excellent condition hybrid vehicle with low mileage. Full service history, single owner.',
    category: 'transport',
    subCategory: 'sedan',
    images: ['/placeholder.svg', '/placeholder.svg'],
    currentBid: 2500000,
    startingBid: 2000000,
    totalBids: 12,
    timeLeft: '2 days 5 hours',
    endTime: isoDay1,
    endTimeIso: isoDay1,
    status: 'active',
    location: { city: 'Lagos', country: 'Nigeria', countryCode: 'NG' },
    year: 2022,
    mileage: 14000,
    engineVolume: 2487,
    fuelType: 'Hybrid',
    sellerId: 'seller-001',
    sellerName: 'John Doe',
    buyerId: null,
    imageUrl: '/placeholder.svg',
    auctionType: 'bid',
    isNew: true,
    specs: '2022 · 14,000 km · 2,487 cm3 · Hybrid',
    watchersCount: 34,
    rating: 4.8,
    reviewCount: 124,
  },
  {
    id: 'auc-002',
    slug: 'macbook-pro-16-m3',
    title: 'MacBook Pro 16" M3 Pro',
    description: 'Latest MacBook Pro with M3 Pro chip, 18GB RAM, 512GB SSD. Like new condition.',
    category: 'electronics',
    subCategory: 'laptops',
    images: ['/placeholder.svg', '/placeholder.svg'],
    currentBid: 1850000,
    startingBid: 1500000,
    totalBids: 8,
    timeLeft: '1 day 12 hours',
    endTime: isoDay3,
    endTimeIso: isoDay3,
    status: 'active',
    location: { city: 'Abuja', country: 'Nigeria', countryCode: 'NG' },
    year: 2024,
    mileage: null,
    engineVolume: null,
    fuelType: null,
    sellerId: 'seller-002',
    sellerName: 'Tech Store NG',
    buyerId: null,
    imageUrl: '/placeholder.svg',
    auctionType: 'bid',
    isNew: false,
    trending: true,
    specs: 'M3 Pro · 18GB RAM · 512GB SSD · Space Gray',
    watchersCount: 52,
    rating: 4.5,
    reviewCount: 89,
  },
  {
    id: 'auc-003',
    slug: 'iphone-15-pro-max',
    title: 'iPhone 15 Pro Max 256GB',
    description: 'Brand new iPhone 15 Pro Max, 256GB, Natural Titanium. Factory sealed.',
    category: 'electronics',
    subCategory: 'phones',
    images: ['/placeholder.svg'],
    currentBid: 980000,
    startingBid: 850000,
    totalBids: 15,
    timeLeft: '3 days 8 hours',
    endTime: isoDay5,
    endTimeIso: isoDay5,
    status: 'active',
    location: { city: 'Port Harcourt', country: 'Nigeria', countryCode: 'NG' },
    year: 2024,
    mileage: null,
    engineVolume: null,
    fuelType: null,
    sellerId: 'seller-003',
    sellerName: 'Mobile World',
    buyerId: null,
    imageUrl: '/placeholder.svg',
    auctionType: 'buy',
    isNew: true,
    specs: '256GB · Natural Titanium · 6.7" · Pro Max',
    watchersCount: 41,
    rating: 4.2,
    reviewCount: 56,
  },
  {
    id: 'auc-004',
    slug: 'luxury-designer-watch',
    title: 'Luxury Designer Chronograph Watch',
    description: 'Authentic designer chronograph watch, brand new with box and papers.',
    category: 'fashion',
    subCategory: 'accessories',
    images: ['/placeholder.svg'],
    currentBid: 450000,
    startingBid: 350000,
    totalBids: 6,
    timeLeft: '5 days 2 hours',
    endTime: isoSevenDays,
    endTimeIso: isoSevenDays,
    status: 'active',
    location: { city: 'Kano', country: 'Nigeria', countryCode: 'NG' },
    year: 2024,
    mileage: null,
    engineVolume: null,
    fuelType: null,
    sellerId: 'seller-004',
    sellerName: 'Luxury Hub NG',
    buyerId: null,
    imageUrl: '/placeholder.svg',
    auctionType: 'bid',
    isNew: false,
    specs: 'Swiss Movement · Leather Strap · Sapphire Crystal',
    watchersCount: 18,
    rating: 4.9,
    reviewCount: 203,
  },
  {
    id: 'auc-005',
    slug: 'construction-equipment-bundle',
    title: 'Heavy Construction Equipment Bundle',
    description: 'Heavy duty construction equipment including excavator and bulldozer. Well maintained.',
    category: 'construction',
    subCategory: 'heavy-machinery',
    images: ['/placeholder.svg', '/placeholder.svg'],
    currentBid: 3200000,
    startingBid: 2800000,
    totalBids: 4,
    timeLeft: '4 days 14 hours',
    endTime: isoDay10,
    endTimeIso: isoDay10,
    status: 'active',
    location: { city: 'Ibadan', country: 'Nigeria', countryCode: 'NG' },
    year: 2021,
    mileage: 5000,
    engineVolume: 6800,
    fuelType: 'Diesel',
    sellerId: 'seller-005',
    sellerName: 'BuildMart Nigeria',
    buyerId: null,
    imageUrl: '/placeholder.svg',
    auctionType: 'bid',
    isNew: true,
    specs: 'Heavy Duty · 2021 Model · Full Service History',
    watchersCount: 9,
    rating: 3.8,
    reviewCount: 34,
  },
  {
    id: 'auc-006',
    slug: 'professional-camera-kit',
    title: 'Professional Camera Kit',
    description: 'Complete photography kit with Sony A7IV camera, lenses, and accessories.',
    category: 'electronics',
    subCategory: 'cameras',
    images: ['/placeholder.svg'],
    currentBid: 780000,
    startingBid: 650000,
    totalBids: 9,
    timeLeft: '6 days 10 hours',
    endTime: isoDay14,
    endTimeIso: isoDay14,
    status: 'active',
    location: { city: 'Enugu', country: 'Nigeria', countryCode: 'NG' },
    year: 2023,
    mileage: null,
    engineVolume: null,
    fuelType: null,
    sellerId: 'seller-006',
    sellerName: 'Photo Pro NG',
    buyerId: null,
    imageUrl: '/placeholder.svg',
    auctionType: 'bid',
    isNew: false,
    trending: true,
    specs: 'Sony A7IV · Full Frame · 4K Video · Weather Sealed',
    watchersCount: 27,
    rating: 4.6,
    reviewCount: 78,
  },
  {
    id: 'auc-007',
    slug: 'mercedes-benz-c300',
    title: '2021 Mercedes Benz C300 AMG Line',
    description: 'Premium German sedan with AMG styling package. Panoramic roof, ambient lighting.',
    category: 'transport',
    subCategory: 'sedan',
    images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    currentBid: 8500000,
    startingBid: 7500000,
    totalBids: 7,
    timeLeft: '3 days 20 hours',
    endTime: isoDay3,
    endTimeIso: isoDay3,
    status: 'active',
    location: { city: 'Lagos', country: 'Nigeria', countryCode: 'NG' },
    year: 2021,
    mileage: 32000,
    engineVolume: 1991,
    fuelType: 'Petrol',
    sellerId: 'seller-007',
    sellerName: 'Premium Autos',
    buyerId: null,
    imageUrl: '/placeholder.svg',
    auctionType: 'bid',
    isNew: false,
    featured: true,
    specs: '2021 · 32,000 km · 1,991 cm3 · Petrol · AMG',
    watchersCount: 63,
    rating: 4.4,
    reviewCount: 91,
  },
  {
    id: 'auc-008',
    slug: 'toyota-hilux-2023',
    title: '2023 Toyota Hilux Double Cabin',
    description: 'Rugged and reliable pickup truck. 4x4, low mileage, perfect for Nigerian roads.',
    category: 'transport',
    subCategory: 'pickup',
    images: ['/placeholder.svg', '/placeholder.svg'],
    currentBid: 12800000,
    startingBid: 11500000,
    totalBids: 11,
    timeLeft: '4 days 6 hours',
    endTime: isoDay5,
    endTimeIso: isoDay5,
    status: 'active',
    location: { city: 'Abuja', country: 'Nigeria', countryCode: 'NG' },
    year: 2023,
    mileage: 8000,
    engineVolume: 2755,
    fuelType: 'Diesel',
    sellerId: 'seller-008',
    sellerName: 'AutoDealers NG',
    buyerId: null,
    imageUrl: '/placeholder.svg',
    auctionType: 'bid',
    isNew: true,
    specs: '2023 · 8,000 km · 2,755 cm3 · Diesel · 4x4',
    watchersCount: 39,
    rating: 4.3,
    reviewCount: 67,
  },
  {
    id: 'auc-009',
    slug: 'samsung-galaxy-s24-ultra',
    title: 'Samsung Galaxy S24 Ultra 512GB',
    description: 'Latest flagship Samsung phone with S Pen. Titanium frame, Galaxy AI features.',
    category: 'electronics',
    subCategory: 'phones',
    images: ['/placeholder.svg'],
    currentBid: 850000,
    startingBid: 750000,
    totalBids: 14,
    timeLeft: '2 days 16 hours',
    endTime: isoDay1,
    endTimeIso: isoDay1,
    status: 'active',
    location: { city: 'Lagos', country: 'Nigeria', countryCode: 'NG' },
    year: 2024,
    mileage: null,
    engineVolume: null,
    fuelType: null,
    sellerId: 'seller-009',
    sellerName: 'Gadget Hub',
    buyerId: null,
    imageUrl: '/placeholder.svg',
    auctionType: 'bid',
    isNew: true,
    specs: '512GB · Titanium Gray · S Pen · Galaxy AI',
    watchersCount: 48,
    rating: 3.9,
    reviewCount: 45,
  },
  {
    id: 'auc-010',
    slug: 'designer-italian-sofa',
    title: 'Luxury Italian Leather Sofa Set',
    description: 'Premium 5-seater Italian leather sofa set. Perfect for living room or office.',
    category: 'real-estate',
    subCategory: 'furniture',
    images: ['/placeholder.svg', '/placeholder.svg'],
    currentBid: 650000,
    startingBid: 500000,
    totalBids: 5,
    timeLeft: '7 days 4 hours',
    endTime: isoSevenDays,
    endTimeIso: isoSevenDays,
    status: 'active',
    location: { city: 'Lagos', country: 'Nigeria', countryCode: 'NG' },
    year: 2024,
    mileage: null,
    engineVolume: null,
    fuelType: null,
    sellerId: 'seller-010',
    sellerName: 'Home Elegance',
    buyerId: null,
    imageUrl: '/placeholder.svg',
    auctionType: 'bid',
    isNew: false,
    specs: 'Italian Leather · 5-Seater · Premium Build',
    watchersCount: 22,
    rating: 4.1,
    reviewCount: 53,
  },
  {
    id: 'auc-011',
    slug: 'nigerian-art-collection',
    title: 'Contemporary Nigerian Art Collection',
    description: 'Stunning original artwork from renowned Nigerian contemporary artist. Oil on canvas.',
    category: 'art',
    subCategory: 'paintings',
    images: ['/placeholder.svg'],
    currentBid: 890000,
    startingBid: 750000,
    totalBids: 11,
    timeLeft: '8 days 12 hours',
    endTime: isoDay10,
    endTimeIso: isoDay10,
    status: 'active',
    location: { city: 'Benin City', country: 'Nigeria', countryCode: 'NG' },
    year: 2024,
    mileage: null,
    engineVolume: null,
    fuelType: null,
    sellerId: 'seller-011',
    sellerName: 'Art Gallery NG',
    buyerId: null,
    imageUrl: '/placeholder.svg',
    auctionType: 'bid',
    isNew: false,
    trending: true,
    specs: 'Oil on Canvas · 24" x 36" · Certificate of Authenticity',
    watchersCount: 45,
    rating: 4.7,
    reviewCount: 156,
  },
  {
    id: 'auc-012',
    slug: 'honda-crv-2023',
    title: '2023 Honda CR-V Sport Touring',
    description: 'Family SUV in excellent condition. Panoramic sunroof, Honda Sensing safety suite.',
    category: 'transport',
    subCategory: 'suv',
    images: ['/placeholder.svg', '/placeholder.svg'],
    currentBid: 9500000,
    startingBid: 8500000,
    totalBids: 9,
    timeLeft: '5 days 22 hours',
    endTime: isoDay5,
    endTimeIso: isoDay5,
    status: 'active',
    location: { city: 'Lagos', country: 'Nigeria', countryCode: 'NG' },
    year: 2023,
    mileage: 18000,
    engineVolume: 1498,
    fuelType: 'Petrol',
    sellerId: 'seller-012',
    sellerName: 'CarHub Nigeria',
    buyerId: null,
    imageUrl: '/placeholder.svg',
    auctionType: 'bid',
    isNew: false,
    specs: '2023 · 18,000 km · 1,498 cm3 · Petrol · AWD',
    watchersCount: 31,
    rating: 4.5,
    reviewCount: 112,
  },
];

const mockCategories = [
  {
    id: 'cat-001',
    name: 'Transport',
    slug: 'transport',
    description: 'Cars, trucks, motorcycles and all things that move',
    imageUrl: '/placeholder.svg',
    subCategories: [
      { id: 'sub-001', name: 'Cars', slug: 'cars' },
      { id: 'sub-002', name: 'SUVs', slug: 'suvs' },
      { id: 'sub-003', name: 'Trucks', slug: 'trucks' },
      { id: 'sub-004', name: 'Motorcycles', slug: 'motorcycles' },
    ],
    productCount: 142,
    isActive: true,
  },
  {
    id: 'cat-002',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Phones, laptops, cameras and all electronics',
    imageUrl: '/placeholder.svg',
    subCategories: [
      { id: 'sub-005', name: 'Phones', slug: 'phones' },
      { id: 'sub-006', name: 'Laptops', slug: 'laptops' },
      { id: 'sub-007', name: 'Cameras', slug: 'cameras' },
      { id: 'sub-008', name: 'TV & Audio', slug: 'tv-audio' },
    ],
    productCount: 98,
    isActive: true,
  },
  {
    id: 'cat-003',
    name: 'Agriculture',
    slug: 'agriculture',
    description: 'Tractors, harvesters and farming equipment',
    imageUrl: '/placeholder.svg',
    subCategories: [
      { id: 'sub-009', name: 'Tractors', slug: 'tractors' },
      { id: 'sub-010', name: 'Harvesters', slug: 'harvesters' },
      { id: 'sub-011', name: 'Livestock', slug: 'livestock' },
    ],
    productCount: 56,
    isActive: true,
  },
  {
    id: 'cat-004',
    name: 'Construction',
    slug: 'construction',
    description: 'Heavy machinery, tools and construction equipment',
    imageUrl: '/placeholder.svg',
    subCategories: [
      { id: 'sub-012', name: 'Excavators', slug: 'excavators' },
      { id: 'sub-013', name: 'Bulldozers', slug: 'bulldozers' },
      { id: 'sub-014', name: 'Cranes', slug: 'cranes' },
      { id: 'sub-015', name: 'Tools', slug: 'tools' },
    ],
    productCount: 73,
    isActive: true,
  },
  {
    id: 'cat-005',
    name: 'Fashion',
    slug: 'fashion',
    description: 'Clothing, shoes, bags and accessories',
    imageUrl: '/placeholder.svg',
    subCategories: [
      { id: 'sub-016', name: 'Clothing', slug: 'clothing' },
      { id: 'sub-017', name: 'Shoes', slug: 'shoes' },
      { id: 'sub-018', name: 'Bags', slug: 'bags' },
      { id: 'sub-019', name: 'Watches', slug: 'watches' },
    ],
    productCount: 85,
    isActive: true,
  },
  {
    id: 'cat-006',
    name: 'Real Estate',
    slug: 'real-estate',
    description: 'Land, houses, apartments and commercial properties',
    imageUrl: '/placeholder.svg',
    subCategories: [
      { id: 'sub-020', name: 'Residential', slug: 'residential' },
      { id: 'sub-021', name: 'Commercial', slug: 'commercial' },
      { id: 'sub-022', name: 'Land', slug: 'land' },
    ],
    productCount: 64,
    isActive: true,
  },
  {
    id: 'cat-007',
    name: 'Art',
    slug: 'art',
    description: 'Paintings, sculptures and collectibles',
    imageUrl: '/placeholder.svg',
    subCategories: [
      { id: 'sub-023', name: 'Paintings', slug: 'paintings' },
      { id: 'sub-024', name: 'Sculptures', slug: 'sculptures' },
      { id: 'sub-025', name: 'Collectibles', slug: 'collectibles' },
    ],
    productCount: 42,
    isActive: true,
  },
  {
    id: 'cat-008',
    name: 'Music',
    slug: 'music',
    description: 'Instruments, audio equipment and music gear',
    imageUrl: '/placeholder.svg',
    subCategories: [
      { id: 'sub-026', name: 'Instruments', slug: 'instruments' },
      { id: 'sub-027', name: 'Audio Equipment', slug: 'audio-equipment' },
      { id: 'sub-028', name: 'Studio Gear', slug: 'studio-gear' },
    ],
    productCount: 38,
    isActive: true,
  },
  {
    id: 'cat-009',
    name: 'Sports',
    slug: 'sports',
    description: 'Sports equipment, fitness gear and outdoor items',
    imageUrl: '/placeholder.svg',
    subCategories: [
      { id: 'sub-029', name: 'Fitness', slug: 'fitness' },
      { id: 'sub-030', name: 'Outdoor', slug: 'outdoor' },
      { id: 'sub-031', name: 'Team Sports', slug: 'team-sports' },
    ],
    productCount: 51,
    isActive: true,
  },
];

const mockBanners = [
  {
    id: 'banner-001',
    title: 'Summer Auction Bonanza',
    imageUrl: '/placeholder.svg',
    link: '/auctions?category=electronics',
    position: 'hero',
    isActive: true,
  },
  {
    id: 'banner-002',
    title: 'Luxury Cars Live Auction',
    imageUrl: '/placeholder.svg',
    link: '/auctions?category=transport',
    position: 'secondary',
    isActive: true,
  },
  {
    id: 'banner-003',
    title: 'Become a Seller Today',
    imageUrl: '/placeholder.svg',
    link: '/auth/seller/register',
    position: 'cta',
    isActive: true,
  },
];

const mockFaqs = [
  {
    id: 'faq-001',
    category: 'General',
    question: 'What is GreyAuction?',
    answer: 'GreyAuction is Nigeria\'s premier online auction platform where you can buy and sell items through transparent bidding.',
    order: 1,
    isActive: true,
  },
  {
    id: 'faq-002',
    category: 'Bidding',
    question: 'How does bidding work?',
    answer: 'Place a bid on any active auction. If your bid is the highest when the auction ends, you win the item. You can set a maximum bid for automatic bidding.',
    order: 2,
    isActive: true,
  },
  {
    id: 'faq-003',
    category: 'Payment',
    question: 'What payment methods are supported?',
    answer: 'We accept credit/debit cards (Visa, Mastercard), bank transfers, and selected local Nigerian payment methods.',
    order: 3,
    isActive: true,
  },
  {
    id: 'faq-004',
    category: 'Shipping',
    question: 'How is delivery handled?',
    answer: 'We partner with reliable logistics companies across Nigeria. Delivery is arranged after successful payment confirmation.',
    order: 4,
    isActive: true,
  },
  {
    id: 'faq-005',
    category: 'Account',
    question: 'Do I need an account to bid?',
    answer: 'Yes, you need a verified account to place bids. Registration is free and takes only a few minutes.',
    order: 5,
    isActive: true,
  },
];

const mockTestimonials = [
  {
    id: 'test-001',
    name: 'Amina Ibrahim',
    role: 'Buyer',
    company: 'Lagos',
    text: 'I won my first auction within minutes! The bidding process was fast, transparent, and I got a great deal on a Toyota Camry.',
    rating: 5,
    imageUrl: '/placeholder.svg',
  },
  {
    id: 'test-002',
    name: 'Chidi Okonkwo',
    role: 'Seller',
    company: 'Abuja',
    text: 'GreyAuction helped me sell my equipment quickly and at a fair price. The platform is professional and secure.',
    rating: 5,
    imageUrl: '/placeholder.svg',
  },
  {
    id: 'test-003',
    name: 'Folake Adeyemi',
    role: 'Buyer',
    company: 'Ibadan',
    text: 'Bidding is fast, simple, and transparent. I won my first auction in minutes and the delivery was seamless.',
    rating: 4,
    imageUrl: '/placeholder.svg',
  },
];

const mockFaqCategories = [
  {
    name: 'General',
    emoji: '\uD83D\uDCE6',
    items: [
      {
        question: 'What is GreyAuction?',
        answer: 'GreyAuction is Nigeria\'s premier online auction platform that allows users to buy and sell items through transparent bidding in a secure environment.',
      },
      {
        question: 'Do I need an account to browse items?',
        answer: 'No, you can browse items freely. However, you need an account to place bids, make purchases, or list items for sale.',
      },
      {
        question: 'Is the platform free to use?',
        answer: 'Browsing and creating an account is free. A small commission is charged on successful auction sales.',
      },
      {
        question: 'What countries do you support?',
        answer: 'We currently support Nigeria, with more countries coming soon.',
      },
      {
        question: 'How do I contact support?',
        answer: 'You can reach our support team via the Contact Us page, email at info@greyauction.com, or call +2347081436524.',
      },
    ],
  },
  {
    name: 'Bidding & Auctions',
    emoji: '\u26A1',
    items: [
      {
        question: 'How does bidding work?',
        answer: 'Place a bid on any active auction. If your bid is the highest when the auction ends, you win the item. You can set a maximum bid and the system will automatically bid on your behalf up to that amount.',
      },
      {
        question: 'What is a reserve price?',
        answer: 'A reserve price is the minimum amount a seller is willing to accept. If bidding does not reach the reserve price, the item will not be sold.',
      },
      {
        question: 'Can I cancel a bid?',
        answer: 'Bids are binding and generally cannot be cancelled. Please review all item details carefully before placing a bid.',
      },
    ],
  },
  {
    name: 'Buying & Payments',
    emoji: '\uD83D\uDCB0',
    items: [
      {
        question: 'What happens after I win an auction?',
        answer: 'You will receive a notification and invoice. Payment must be completed within the specified timeframe to secure your purchase.',
      },
      {
        question: 'What payment methods are supported?',
        answer: 'We accept credit/debit cards (Visa, Mastercard), bank transfers, and selected local Nigerian payment methods.',
      },
      {
        question: 'Is my payment secure?',
        answer: 'Yes, all payments are processed through secure, encrypted channels. We never store your full card details.',
      },
    ],
  },
  {
    name: 'Delivery & Inspection',
    emoji: '\uD83D\uDCCB',
    items: [
      {
        question: 'Can I inspect an item before delivery?',
        answer: 'Yes, inspection can be arranged for certain items. Contact the seller through the platform to schedule an inspection.',
      },
      {
        question: 'Who handles delivery?',
        answer: 'Delivery is arranged between buyer and seller. We partner with reliable logistics companies across Nigeria.',
      },
    ],
  },
  {
    name: 'Payments & Withdrawals',
    emoji: '\uD83D\uDCB3',
    items: [
      {
        question: 'How do I withdraw my earnings as a seller?',
        answer: 'Navigate to your seller dashboard and request a withdrawal. Funds are typically transferred to your registered bank account within 3-5 business days.',
      },
      {
        question: 'Are there any fees for withdrawals?',
        answer: 'Standard withdrawals are free. Express withdrawals may incur a small processing fee.',
      },
      {
        question: 'What currency are transactions in?',
        answer: 'All transactions on the platform are in Nigerian Naira (NGN).',
      },
    ],
  },
];

// F16 + 5.7: mock fallbacks are now OPT-IN. A broken API renders an honest
// empty state unless the developer explicitly turns the escape hatch on with
// NEXT_PUBLIC_USE_MOCK_FALLBACK=true — and when it is on, say so loudly,
// because plausible fake data is exactly how wiring bugs go unnoticed.
const USE_MOCK_FALLBACK = process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === 'true';
if (USE_MOCK_FALLBACK && process.env.NODE_ENV !== 'production') {
  console.warn(
    '[data.ts] NEXT_PUBLIC_USE_MOCK_FALLBACK=true — mock fallbacks ENABLED: API failures will render mock lots/categories/banners instead of empty states',
  );
}

// ─── Website ─────────────────────────────────────────────────────────────

interface AuctionFetchFilters {
  category?: string;
  subCategory?: string;
}

export async function getAuctions(filters?: AuctionFetchFilters) {
  // Aggregate every active lot via the API's paginated contract
  // (GET /products?page=N&limit=M -> { data, total, page, limit }). When
  // category/subCategory filters are given (URL-driven deep links), the
  // backend filters server-side and only the matching page set is fetched —
  // the structural step that replaces the old fetch-everything aggregate.
  // Loop stops on the first short page; the 1000-lot ceiling keeps payloads
  // sane for the unfiltered sidebar-browsing path.
  const PAGE_SIZE = 100;
  const MAX_PAGES = 10; // ceiling: 1000 lots
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.subCategory) params.set('subCategory', filters.subCategory);
  const baseQuery = params.toString();
  const collected: unknown[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const qs = baseQuery ? '&' + baseQuery : '';
    const data = await apiFetch(`/products?page=${page}&limit=${PAGE_SIZE}${qs}`);
    const list = unwrapList(data);
    if (!list || list.length === 0) break;
    collected.push(...list);
    if (list.length < PAGE_SIZE) break;
  }
  if (collected.length > 0) {
    return attachSellerBadges(collected.map(normalizeAuction));
  }
  return USE_MOCK_FALLBACK ? mockAuctions : [];
}

/**
 * Server-served per-arm (subcategory) counts for the institutional-arm tabs.
 * Returns null when the backend is unreachable — callers fall back to a
 * client-side aggregate over the loaded slice.
 */
export async function getArmCounts(
  category: string,
): Promise<Record<string, number> | null> {
  const data = await apiFetch(
    `/products/arm-counts?category=${encodeURIComponent(category)}`,
  );
  if (data && typeof data === 'object' && 'counts' in (data as Record<string, unknown>)) {
    const counts = (data as { counts?: unknown }).counts;
    if (counts && typeof counts === 'object') {
      return counts as Record<string, number>;
    }
  }
  return null;
}

export async function getAuctionBySlug(slug: string) {
  const data = await apiFetch(`/products/${encodeURIComponent(slug)}`);
  if (data) return normalizeAuction(data);
  return USE_MOCK_FALLBACK ? mockAuctions.find((a) => a.slug === slug || a.id === slug) || null : null;
}

/** A seller review as exposed by the public GET /sellers/:id/reviews route. */
export interface SellerReviewPublic {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  response?: string | null;
  responded_at?: string | null;
  is_verified_purchase?: boolean;
  helpful_count?: number;
  images?: string[] | null;
  created_at?: string;
}

export interface SellerReviewsView {
  reviews: SellerReviewPublic[];
  total: number;
  averageRating: number;
  /** star (1-5) -> count */
  ratingBreakdown: Record<string, number>;
}

const EMPTY_REVIEWS: SellerReviewsView = {
  reviews: [],
  total: 0,
  averageRating: 0,
  ratingBreakdown: {},
};

/**
 * Seller reputation for the lot page. Returns an empty view rather than
 * throwing so a seller with no reviews — or a cold backend — still renders
 * a sane tab instead of a broken page.
 */
export async function getSellerReviews(
  sellerId: string,
  limit = 10,
): Promise<SellerReviewsView> {
  if (!sellerId) return EMPTY_REVIEWS;
  const json = await apiFetchEnvelope(
    `/sellers/${encodeURIComponent(sellerId)}/reviews?page=1&limit=${limit}`,
  );
  if (!json) return EMPTY_REVIEWS;

  const reviews = Array.isArray(json.data)
    ? (json.data as SellerReviewPublic[])
    : [];
  const breakdown = json.rating_breakdown;

  return {
    reviews,
    total: Number(json.total ?? reviews.length),
    averageRating: Number(json.average_rating ?? 0),
    ratingBreakdown:
      breakdown && typeof breakdown === 'object'
        ? (breakdown as Record<string, number>)
        : {},
  };
}

export async function getFeaturedAuctions() {
  const data = await apiFetch('/products/featured');
  const list = unwrapList(data);
  if (list && list.length > 0) {
    return attachSellerBadges(list.map(normalizeAuction));
  }
  return USE_MOCK_FALLBACK ? mockAuctions.slice(0, 8) : [];
}

export async function getCategories() {
  const data = await apiFetch('/categories');
  const list = unwrapList(data);
  if (list && list.length > 0) return list as WebsiteCategory[];
  return (USE_MOCK_FALLBACK ? mockCategories : []) as unknown as WebsiteCategory[];
}

export async function getRelatedAuctions(category: string) {
  const data = await apiFetch(
    `/products/related?category=${encodeURIComponent(category)}`,
  );
  const list = unwrapList(data);
  if (list && list.length > 0) {
    return attachSellerBadges(list.map(normalizeAuction));
  }
  return USE_MOCK_FALLBACK
    ? mockAuctions.filter(
        (a) => a.category?.toLowerCase() === category?.toLowerCase(),
      )
    : [];
}

export async function getAuctionsByCategory(category: string) {
  const data = await apiFetch(
    `/products?category=${encodeURIComponent(category)}`,
  );
  const list = unwrapList(data);
  if (list && list.length > 0) {
    return attachSellerBadges(list.map(normalizeAuction));
  }
  return USE_MOCK_FALLBACK
    ? mockAuctions.filter(
        (a) => a.category?.toLowerCase() === category?.toLowerCase(),
      )
    : [];
}

export async function getBanners() {
  const data = await apiFetch('/banners');
  const list = unwrapList(data);
  if (list && list.length > 0) return list;
  return USE_MOCK_FALLBACK ? mockBanners : [];
}

export async function getFaqs() {
  const data = await apiFetch('/faqs');
  const list = unwrapList(data);
  if (list && list.length > 0) return list;
  return USE_MOCK_FALLBACK ? mockFaqs : [];
}

export async function getTestimonials() {
  // No backend entity for testimonials yet — marketing copy stays client-side
  return USE_MOCK_FALLBACK ? mockTestimonials : [];
}

export async function getFaqCategories() {
  const data = await apiFetch('/faqs');
  const list = unwrapList(data);
  if (list && list.length > 0) {
    // Group the flat FAQ rows into the FAQCategory shape the UI expects
    const groups = new Map<string, { question: string; answer: string }[]>();
    for (const faq of list) {
      const row = faq as { category?: unknown; question?: unknown; answer?: unknown };
      const name = (typeof row.category === 'string' && row.category) || 'General';
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name)!.push({
        question: (typeof row.question === 'string' && row.question) || '',
        answer: (typeof row.answer === 'string' && row.answer) || '',
      });
    }
    const EMOJIS = ['📦', '💬', '💰', '🛠️', '🚚', '🔒', '⭐', '🏷️'];
    let i = 0;
    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      emoji: EMOJIS[i++ % EMOJIS.length],
      items,
    }));
  }
  return USE_MOCK_FALLBACK ? mockFaqCategories : [];
}

export async function getCartItems() {
  // Cart is frontend-owned state (Redux); no backend module exists
  return [];
}

export async function getOrderItems() {
  // Order items flow through the backend orders module; the client cart is not
  // fully wired yet, so the checkout forms render an empty list.
  return [];
}

export async function getOrderById(orderId: string) {
  if (!orderId) return null;
  return apiFetch(`/orders/${encodeURIComponent(orderId)}`);
}

/**
 * Buyer-facing invoice summary for the checkout pages (party-guarded API;
 * apiFetch attaches the session JWT). Returns null when the invoice does not
 * exist or does not belong to the signed-in user.
 */
export async function getBuyerInvoice(invoiceId: string) {
  if (!invoiceId) return null;
  try {
    const inv = (await apiFetch(`/invoices/${encodeURIComponent(invoiceId)}`)) as
      | {
          id?: string;
          invoice_number?: string;
          total?: number | string;
          status?: string;
          currency?: string;
        }
      | null;
    if (!inv?.id) return null;
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number || '',
      total: Number(inv.total ?? 0),
      status: inv.status || 'issued',
      currency: (inv.currency || 'NGN').toUpperCase(),
    };
  } catch {
    return null;
  }
}

export async function getWishlistItems() {
  // Backed by the watchlist module; apiFetch forwards the session token so the
  // JWT-guarded /watchlist route returns this user's lots.
  const data = await apiFetch('/watchlist');
  const list = unwrapList(data);
  if (list) return list.map(normalizeAuction);
  return [] as ReturnType<typeof normalizeAuction>[];
}

// ─── Admin ──────────────────────────────────────────────────────────────

/**
 * Display helpers for the admin table rows.
 *
 * Every admin table declares its own render keys (`item`, `amount`, `joinDate`
 * ...) while the API answers with entity field names (`invoice_number`, `total`,
 * `created_at`). Casting one to the other left every unshared key `undefined`,
 * which TanStack renders as an empty cell and `payments_stats_card` turned into
 * NaN when it summed `p.amount`. Each `to*Row` below is that missing bridge.
 */
const toDisplayDate = (value?: string | Date | null): string => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toCount = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Backend ProductStatus → the admin table's AuctionStatus (tab filter values). */
const ADMIN_AUCTION_STATUS: Record<string, AdminAuction['status']> = {
  active: 'Active',
  approved: 'Active',
  pending_approval: 'Pending',
  draft: 'Pending',
  rejected: 'Rejected',
  withdrawn: 'Rejected',
  sold: 'Completed',
  closed: 'Completed',
  expired: 'Completed',
  awaiting_seller_approval: 'Completed',
};

const toAuctionRow = (raw: unknown): AdminAuction => {
  const auction = normalizeAuction(raw);
  const rawStatus = String((raw as { status?: unknown })?.status ?? '').toLowerCase();
  return {
    id: auction.id,
    item: auction.title || '—',
    itemImage: auction.imageUrl,
    seller: auction.sellerName || '—',
    category: auction.category || '—',
    startingBid: toCount(auction.startingBid),
    currentBid: toCount(auction.currentBid),
    bids: toCount(auction.totalBids),
    endDate: toDisplayDate(auction.endTimeIso),
    status: ADMIN_AUCTION_STATUS[rawStatus] ?? 'Completed',
  };
};

interface RawBidRow {
  id: string;
  amount?: number | string | null;
  createdAt?: string | null;
  isWinningBid?: boolean;
  product?: {
    title?: string | null;
    category?: string | null;
    startingBid?: number | string | null;
    seller?: { business_name?: string | null; name?: string | null } | null;
  } | null;
  bidder?: { name?: string | null; email?: string | null } | null;
}

const toBidRow = (raw: RawBidRow): AdminBid =>
  ({
    id: raw.id,
    item: raw.product?.title || '—',
    seller:
      raw.product?.seller?.business_name || raw.product?.seller?.name || '—',
    category: raw.product?.category || '—',
    startingBid: toCount(raw.product?.startingBid),
    currentBid: toCount(raw.amount),
    bids: 1,
    endDate: toDisplayDate(raw.createdAt),
    // A bid is only live while it is the winning one; the table's tabs filter
    // on exactly Active / Ending / Completed.
    status: raw.isWinningBid === false ? 'Completed' : 'Active',
    bidder: raw.bidder?.name || raw.bidder?.email || '—',
    bidType: 'Manual',
    bidAmount: toCount(raw.amount),
    bidDate: toDisplayDate(raw.createdAt),
  }) as unknown as AdminBid;

interface RawBuyerRow {
  id: string;
  name?: string | null;
  email?: string | null;
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAt?: string | null;
}

const toBuyerRow = (raw: RawBuyerRow): AdminBuyer =>
  ({
    id: raw.id,
    name: raw.name || raw.email || '—',
    email: raw.email || '—',
    verified: Boolean(raw.isEmailVerified),
    phone: '—',
    location: '—',
    // Bid/win/spend aggregates are not part of the buyer list payload.
    totalBids: 0,
    totalWins: 0,
    totalSpent: 0,
    joinDate: toDisplayDate(raw.createdAt),
    status: raw.isActive === false ? 'Suspended' : 'Active',
  }) as unknown as AdminBuyer;

interface RawSellerRow {
  id: string;
  user_id?: string | null;
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  status?: string | null;
  total_products?: number | string | null;
  total_orders?: number | string | null;
  total_sales?: number | string | null;
  created_at?: string | null;
}

/** SELLER enum (ACTIVE/INACTIVE/SUSPENDED/BANNED) → the UI's SellerStatus. */
const toSellerStatus = (value?: string | null): AdminSeller['status'] => {
  switch ((value || '').toUpperCase()) {
    case 'ACTIVE':
      return 'Active';
    case 'INACTIVE':
      return 'Inactive';
    case 'SUSPENDED':
    case 'BANNED':
      return 'Suspended';
    default:
      return 'Inactive';
  }
};

const toSellerRow = (raw: RawSellerRow): AdminSeller => {
  const location = [raw.city, raw.country].filter(Boolean).join(', ');
  return {
    id: raw.id,
    name: raw.business_name || raw.email || '—',
    email: raw.email || '—',
    phone: raw.phone || '—',
    location: location || '—',
    totalListings: toCount(raw.total_products),
    totalSales: toCount(raw.total_orders),
    totalRevenue: toCount(raw.total_sales),
    joinDate: toDisplayDate(raw.created_at),
    status: toSellerStatus(raw.status),
  } as unknown as AdminSeller;
};

export async function getAdminAuctions() {
  const data = await apiFetch('/admin/auctions');
  const list = unwrapList(data);
  if (list && list.length > 0) return list.map(toAuctionRow);
  return (USE_MOCK_FALLBACK ? mockAuctions : []).map(toAuctionRow);
}

export async function getAdminBids() {
  const data = await apiFetch('/admin/bids');
  const list = unwrapList(data);
  return ((list ?? []) as RawBidRow[]).map(toBidRow);
}

export async function getAdminBuyers() {
  const data = await apiFetch('/admin/buyers');
  const list = unwrapList(data);
  return ((list ?? []) as RawBuyerRow[]).map(toBuyerRow);
}

export async function getAdminSellers() {
  const data = await apiFetch('/admin/sellers');
  const list = unwrapList(data);
  return ((list ?? []) as RawSellerRow[]).map(toSellerRow);
}

export async function getAdminAdmins() {
  const data = await apiFetch('/admin/admins');
  const list = unwrapList(data);
  return ((list ?? []) as RawAdminRow[]).map(toAdminRow);
}

interface RawCategoryRow {
  id: string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  productCount?: number | string | null;
  isActive?: boolean;
  createdAt?: string | null;
}

const toCategoryRow = (raw: RawCategoryRow): AdminCategory =>
  ({
    id: raw.id,
    // The categories entity calls it `name`; the table renders `category`.
    category: raw.name || '—',
    icon: raw.imageUrl || undefined,
    // Categories are flat on the backend — there is no parent to show.
    parentCategory: '—',
    slug: raw.slug || '—',
    listings: toCount(raw.productCount),
    createdAt: toDisplayDate(raw.createdAt),
    status: raw.isActive === false ? 'Inactive' : 'Active',
    description: raw.description || '',
  }) as unknown as AdminCategory;

export async function getAdminCategories() {
  const data = await apiFetch('/categories');
  const list = unwrapList(data);
  if (list && list.length > 0) return (list as RawCategoryRow[]).map(toCategoryRow);
  return (USE_MOCK_FALLBACK ? mockCategories : []).map((category) =>
    toCategoryRow(category as RawCategoryRow),
  );
}

/**
 * The admin content tables render a 'status' string, but the API returns an
 * `isActive` boolean — casting straight across left `status` undefined, so
 * every row looked active and the Enable/Disable label was always wrong.
 */
interface RawBannerRow {
  id: string;
  title?: string;
  imageUrl?: string;
  link?: string | null;
  type?: string | null;
  position?: number;
  isActive?: boolean;
  createdAt?: string;
}

interface RawFaqRow {
  id: string;
  question?: string;
  answer?: string;
  category?: string;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
}

interface RawAdminRow {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
}

const toBannerRow = (raw: RawBannerRow): AdminBanner =>
  ({
    id: raw.id,
    title: raw.title || '',
    image: raw.imageUrl || '',
    link: raw.link || '',
    type: raw.type || '',
    visibility: raw.isActive === false ? 'Hidden' : 'Visible',
    createdAt: raw.createdAt || '',
    status: raw.isActive === false ? 'Inactive' : 'Active',
  }) as unknown as AdminBanner;

const toFaqRow = (raw: RawFaqRow): AdminFaq =>
  ({
    id: raw.id,
    question: raw.question || '',
    answer: raw.answer || '',
    category: raw.category || '',
    order: raw.order ?? 0,
    createdAt: raw.createdAt || '',
    status: raw.isActive === false ? 'Inactive' : 'Active',
  }) as unknown as AdminFaq;

const toAdminRow = (raw: RawAdminRow): AdminUser =>
  ({
    id: raw.id,
    name: raw.name || '',
    email: raw.email || '',
    phone: '',
    role: raw.role || 'platform_admin',
    lastLogin: '',
    joinDate: raw.createdAt || '',
    status: raw.isActive === false ? 'Suspended' : 'Active',
  }) as unknown as AdminUser;

export async function getAdminBanners() {
  const data = await apiFetch('/admin/banners');
  const list = unwrapList(data);
  if (list && list.length > 0) return (list as RawBannerRow[]).map(toBannerRow);
  return (USE_MOCK_FALLBACK ? mockBanners : []) as unknown as AdminBanner[];
}

export async function getAdminFaqs() {
  const data = await apiFetch('/admin/faqs');
  const list = unwrapList(data);
  if (list && list.length > 0) return (list as RawFaqRow[]).map(toFaqRow);
  return (USE_MOCK_FALLBACK ? mockFaqs : []) as unknown as AdminFaq[];
}

/** InvoiceStatus (issued/paid/cancelled) → the UI's PaymentStatus. */
const INVOICE_STATUS_TO_PAYMENT: Record<string, AdminPayment['status']> = {
  paid: 'Completed',
  issued: 'Pending',
  cancelled: 'Failed',
};

interface RawInvoiceRow {
  id: string;
  invoice_number?: string | null;
  total?: number | string | null;
  payment_method?: string | null;
  issued_at?: string | null;
  status?: string | null;
}

const toPaymentRow = (raw: RawInvoiceRow): AdminPayment =>
  ({
    id: raw.id,
    item: raw.invoice_number || '—',
    // Party names are ids on the invoice payload; only the totals are readable.
    buyer: '—',
    seller: '—',
    amount: toCount(raw.total),
    // Free-form in the DB (paystack, transfer, ...) — narrower union in the UI.
    method: raw.payment_method || '—',
    date: toDisplayDate(raw.issued_at),
    status:
      INVOICE_STATUS_TO_PAYMENT[String(raw.status ?? '').toLowerCase()] ?? 'Pending',
  }) as unknown as AdminPayment;

export async function getAdminPayments() {
  const data = await apiFetch('/admin/payments');
  const list = unwrapList(data);
  return ((list ?? []) as RawInvoiceRow[]).map(toPaymentRow);
}

export async function getAdminBiddingRooms() {
  const data = await apiFetch('/rooms');
  const list = unwrapList(data);
  return (list ?? []) as AdminBiddingRoom[];
}

interface RawTicketRow {
  id: string;
  subject?: string | null;
  description?: string | null;
  status?: string | null;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  messages?: Array<{
    senderId?: string | null;
    content?: string | null;
    timestamp?: string | null;
  }> | null;
  createdAt?: string | null;
}

/**
 * The tickets table renders a conversation object (`contact`, `lastMessage`),
 * but `/tickets` returns the flat entity, so `ticket.contact.name.toLowerCase()`
 * threw as soon as a ticket existed.
 */
const toTicketRow = (raw: RawTicketRow): AdminTicket => {
  const messages = (Array.isArray(raw.messages) ? raw.messages : []).map(
    (message, index) => ({
      id: `${raw.id}-msg-${index}`,
      senderId: message?.senderId || '',
      content: message?.content || '',
      timestamp: message?.timestamp || '',
      type: 'text' as const,
    }),
  );
  const last = messages[messages.length - 1];
  const body = raw.description || raw.subject || '';
  // Tickets opened before the messages table get their body as the first turn.
  if (messages.length === 0 && body) {
    messages.push({
      id: `${raw.id}-msg-0`,
      senderId: raw.userId || '',
      content: body,
      timestamp: raw.createdAt || '',
      type: 'text',
    });
  }
  return {
    id: raw.id,
    contact: {
      name: raw.userName || raw.userEmail || 'Unknown contact',
      avatar: '',
      email: raw.userEmail || '',
      phone: '—',
      sellerId: raw.userId || '—',
    },
    lastMessage: last?.content || body || raw.subject || '',
    lastMessageTime: toDisplayDate(last?.timestamp || raw.createdAt),
    unread: false,
    messages,
    sharedMedia: [],
  } as unknown as AdminTicket;
};

export async function getAdminTickets() {
  const data = await apiFetch('/tickets');
  const list = unwrapList(data);
  return ((list ?? []) as RawTicketRow[]).map(toTicketRow);
}

// ─── Seller ─────────────────────────────────────────────────────────────

/** One document the admin has asked the account holder to provide. */
export interface KycChecklistItem {
  requirementId: string;
  code: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  maxSizeMb: number;
  allowedMimeTypes: string[];
  document: {
    id: string;
    fileName: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewNotes: string | null;
    reviewedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
  } | null;
}

export interface KycStatusView {
  isVerified: boolean;
  requiredTotal: number;
  requiredApproved: number;
  pendingReview: number;
  rejected: number;
  outstanding: Array<{ code: string; name: string }>;
  checklist: KycChecklistItem[];
}

const EMPTY_KYC_STATUS: KycStatusView = {
  isVerified: true,
  requiredTotal: 0,
  requiredApproved: 0,
  pendingReview: 0,
  rejected: 0,
  outstanding: [],
  checklist: [],
};

/**
 * KYC status for the signed-in account holder. The requirement names come from
 * the admin, so nothing here is hardcoded. Returns an empty ("nothing asked of
 * you") status on failure rather than throwing.
 */
export async function getKycStatus(): Promise<KycStatusView> {
  const data = await apiFetch('/kyc/status');
  if (!data || typeof data !== 'object') return EMPTY_KYC_STATUS;
  const view = data as Partial<KycStatusView>;
  return {
    ...EMPTY_KYC_STATUS,
    ...view,
    checklist: Array.isArray(view.checklist) ? view.checklist : [],
    outstanding: Array.isArray(view.outstanding) ? view.outstanding : [],
  };
}

/** Admin view: the document requirements currently configured. */
export interface KycRequirementRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  audience: 'buyer' | 'seller' | 'both';
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
}

export async function getKycRequirements(): Promise<KycRequirementRow[]> {
  const data = await apiFetch('/admin/kyc/requirements');
  const list = unwrapList(data);
  return (list ?? []) as unknown as KycRequirementRow[];
}

/** Full price breakdown for a bid amount — the buyer's final bill, itemised. */
export interface BuyerPriceBreakdown {
  bidAmount: number;
  buyerFee: number;
  vatOnBid: number;
  vatOnBuyerFee: number;
  otherCharges: number;
  fixedFee: number;
  total: number;
  vatTotal: number;
  source: string;
  vatBase: string;
  rates?: Record<string, unknown>;
}

export async function getBuyerPriceBreakdown(
  amount: number,
  productId?: string,
  sellerId?: string,
  category?: string,
): Promise<BuyerPriceBreakdown | null> {
  if (!amount || amount <= 0) return null;
  const params = new URLSearchParams({ amount: String(amount) });
  if (productId) params.set('productId', productId);
  if (sellerId) params.set('sellerId', sellerId);
  if (category) params.set('category', category);
  const data = await apiFetch(`/fees/breakdown?${params.toString()}`);
  if (!data || typeof data !== 'object') return null;
  return data as BuyerPriceBreakdown;
}

/** One sold lot as the seller sees it: buyer bill, deductions, and net. */
export interface SellerEarningLine {
  invoiceId: string;
  invoiceNumber: string;
  lotTitle: string | null;
  currency: string;
  issuedAt: string;
  status: string;
  buyer: {
    hammerPrice: number;
    buyerPremium: number;
    vat: number;
    otherCharges: number;
    fixedFee: number;
    total: number;
  };
  deductions: { platformCommission: number; ratePctOfHammer: number };
  seller: {
    net: number;
    escrowStatus: string | null;
    escrowReleaseAt: string | null;
    releasedAt: string | null;
  };
}

export interface SellerEarnings {
  currency: string;
  totals: {
    lotsSold: number;
    grossBilledToBuyers: number;
    totalDeductions: number;
    sellerNet: number;
    pendingEscrow: number;
    releasedToWallet: number;
  };
  lines: SellerEarningLine[];
}

const EMPTY_EARNINGS: SellerEarnings = {
  currency: 'NGN',
  totals: {
    lotsSold: 0,
    grossBilledToBuyers: 0,
    totalDeductions: 0,
    sellerNet: 0,
    pendingEscrow: 0,
    releasedToWallet: 0,
  },
  lines: [],
};

/** What the account holder actually receives, per lot, with the calculation. */
export async function getSellerEarnings(): Promise<SellerEarnings> {
  const data = await apiFetch('/sellers/me/earnings');
  if (!data || typeof data !== 'object') return EMPTY_EARNINGS;
  const view = data as Partial<SellerEarnings>;
  return {
    currency: view.currency ?? 'NGN',
    totals: { ...EMPTY_EARNINGS.totals, ...(view.totals ?? {}) },
    lines: Array.isArray(view.lines) ? view.lines : [],
  };
}

export async function getSellerListings() {
  // Ownership belongs to the account holder, so read their own lots from the
  // account-scoped route first. /sellers/me/products additionally requires a
  // Seller KYC record and 403s for an account holder who has not onboarded one.
  const mine = await apiFetch('/products/mine');
  const mineList = unwrapList(mine);
  if (mineList) return mineList.map(normalizeAuction);

  const data = await apiFetch('/sellers/me/products');
  const list = unwrapList(data);
  if (list && list.length > 0) return list.map(normalizeAuction);
  return [];
}

/**
 * A seller's payout requests, mapped onto the payments table's columns.
 * The rows are SellerPayout records; casting them straight to AdminPayment left
 * every cell blank.
 */
export async function getSellerPayments() {
  const data = await apiFetch('/sellers/payouts/me');
  const list = unwrapList(data);
  if (!Array.isArray(list)) return [] as AdminPayment[];

  const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    CANCELLED: 'Failed',
    REVERSED: 'Failed',
  };

  return (list as Array<Record<string, unknown>>).map(
    (row) =>
      ({
        id: String(row.id ?? ''),
        item: 'Payout ' + String(row.id ?? '').slice(0, 8),
        buyer: '—',
        seller: '—',
        amount: Number(row.net_amount ?? row.gross_amount ?? 0),
        method: String(row.payout_method ?? '—'),
        date: String(row.requested_at ?? row.created_at ?? ''),
        status: STATUS_LABEL[String(row.status ?? '').toUpperCase()] ?? 'Pending',
      }) as unknown as AdminPayment,
  );
}

export async function getSellerSales() {
  // GET /sellers/me/sales answers { success, data: { products, invoices } };
  // this used to look for `products` at the top level, so the Sales table was
  // permanently empty.
  const data = await apiFetch('/sellers/me/sales');
  const payload = data as
    | { products?: unknown; data?: unknown }
    | null;
  // Shape today: { success, data: { products, invoices, totalRevenue } }.
  const nested = payload?.data as { products?: unknown } | unknown[] | undefined;
  const products = Array.isArray(nested) ? nested : nested?.products ?? payload?.products;
  return Array.isArray(products) ? (products as SellerSale[]) : [];
}

export async function getSellerBiddingRooms() {
  const data = await apiFetch('/rooms');
  const list = unwrapList(data);
  return (list ?? []) as SellerBiddingRoom[];
}

/** Backend conversation row from GET /sellers/me/conversations. */
interface RawConversation {
  id: string;
  lastMessageAt?: string | null;
  otherParticipant?: { id: string; name?: string | null; email?: string | null } | null;
  lastMessage?: { id: string; content: string | null; createdAt: string } | null;
  unreadCount?: number;
}

/**
 * Map the chat module's conversation row onto the seller UI model.
 *
 * The old code cast the payload straight to `Conversation`, which is a
 * different shape (contact/lastMessage/unread) — so even once the API returned
 * data, the panel would have rendered blanks.
 */
function mapSellerConversation(raw: RawConversation): SellerConversation {
  const name = raw.otherParticipant?.name || raw.otherParticipant?.email || 'Conversation';
  return {
    id: raw.id,
    contact: {
      name,
      avatar: '/placeholder.svg',
      email: raw.otherParticipant?.email || '',
      phone: '',
      location: '',
    },
    lastMessage: raw.lastMessage?.content || 'No messages yet',
    lastMessageTime: raw.lastMessageAt || raw.lastMessage?.createdAt || '',
    unread: (raw.unreadCount ?? 0) > 0,
    // The thread is fetched per conversation by the chat view.
    messages: [],
    sharedMedia: [],
  };
}

export async function getSellerConversations(): Promise<SellerConversation[]> {
  const data = await apiFetch('/sellers/me/conversations');
  const list = unwrapList(data);
  if (!Array.isArray(list)) return [];
  return (list as RawConversation[]).map(mapSellerConversation);
}

/** Product document as returned by the public GET /products/:id/documents route. */
export interface ProductDocument {
  id: string;
  productId: string;
  documentType: string;
  title?: string | null;
  description?: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: string;
  uploadedAt: string;
}

/** Fee breakdown as returned by GET /fees/breakdown. */
export interface FeeBreakdown {
  bidAmount: number;
  buyerFee: number;
  sellerFee: number;
  vatOnBid: number;
  vatOnBuyerFee: number;
  vatOnCommission: number;
  otherCharges: number;
  fixedFee: number;
  total: number;
  sellerNet: number;
  vatBase: string;
  source: string;
}

/**
 * Fetch verified documents for a product (public endpoint, no auth required).
 * Returns empty array on failure rather than throwing.
 */
export async function getProductDocuments(productId: string): Promise<ProductDocument[]> {
  if (!productId) return [];
  try {
    const data = await apiFetch(`/products/${encodeURIComponent(productId)}/documents`);
    const list = unwrapList(data);
    if (list && Array.isArray(list)) return list as ProductDocument[];
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch fee breakdown for a bid amount (requires auth for per-product/seller overrides).
 * Returns a minimal breakdown with buyerFee percentage for display.
 */
export async function getFeeBreakdown(
  amount: number,
  productId?: string,
  category?: string,
): Promise<FeeBreakdown | null> {
  if (!amount || amount <= 0) return null;
  const params = new URLSearchParams({ amount: String(amount) });
  if (productId) params.set('productId', productId);
  if (category) params.set('category', category);
  try {
    const data = await apiFetch(`/fees/breakdown?${params.toString()}`);
    if (!data || typeof data !== 'object') return null;
    return data as FeeBreakdown;
  } catch {
    return null;
  }
}

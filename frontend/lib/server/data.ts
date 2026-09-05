import { auth } from '@/auth';
import { cache } from 'react';
import type { Auction } from '@/app/[locale]/(website)/models';

// Typed server-data boundary: each getter below asserts the entity shape its
// consumers (admin/seller/website pages) render with.
import type {
  Admin as AdminUser,
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Per-request session token — cached with React cache() so a page render
 * performs at most one auth() decode (no cross-request leakage).
 */
const getSessionToken = cache(async (): Promise<string | null> => {
  try {
    const session = await auth();
    return session?.user?.accessToken || null;
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
  const status: Auction['status'] =
    raw?.status === 'sold' ? 'sold' : 'active';
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
    rating: Number(raw?.seller?.rating ?? 0),
    reviewCount: Number(raw?.seller?.reviewCount ?? 0),
  };
}

/** Unwrap the many list shapes the API returns into a plain array. */
function unwrapList(data: unknown): unknown[] | null {
  if (!data) return null;
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null) {
    const record = data as { items?: unknown; data?: unknown };
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.data)) return record.data;
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

// F16: never fabricate data in production — mock fallbacks are dev-only so a
// failed API in prod renders an honest empty/error state instead of fake lots.
const USE_MOCK_FALLBACK = process.env.NODE_ENV !== 'production';

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
  if (collected.length > 0) return collected.map(normalizeAuction);
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

export async function getFeaturedAuctions() {
  const data = await apiFetch('/products/featured');
  const list = unwrapList(data);
  if (list && list.length > 0) return list.map(normalizeAuction);
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
  if (list && list.length > 0) return list.map(normalizeAuction);
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
  if (list && list.length > 0) return list.map(normalizeAuction);
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
      | { id?: string; invoice_number?: string; total?: number | string; status?: string }
      | null;
    if (!inv?.id) return null;
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number || '',
      total: Number(inv.total ?? 0),
      status: inv.status || 'issued',
    };
  } catch {
    return null;
  }
}

export async function getWishlistItems() {
  // Wishlist is frontend-owned state (Redux); no backend module exists
  return [];
}

// ─── Admin ──────────────────────────────────────────────────────────────

export async function getAdminAuctions() {
  const data = await apiFetch('/admin/auctions');
  const list = unwrapList(data);
  if (list && list.length > 0) return list.map(normalizeAuction);
  return USE_MOCK_FALLBACK ? mockAuctions : [];
}

export async function getAdminBids() {
  const data = await apiFetch('/admin/bids');
  const list = unwrapList(data);
  return (list ?? []) as AdminBid[];
}

export async function getAdminBuyers() {
  const data = await apiFetch('/admin/buyers');
  const list = unwrapList(data);
  return (list ?? []) as AdminBuyer[];
}

export async function getAdminSellers() {
  const data = await apiFetch('/admin/sellers');
  const list = unwrapList(data);
  return (list ?? []) as AdminSeller[];
}

export async function getAdminAdmins() {
  const data = await apiFetch('/admin/admins');
  const list = unwrapList(data);
  return (list ?? []) as AdminUser[];
}

export async function getAdminCategories() {
  const data = await apiFetch('/categories');
  const list = unwrapList(data);
  if (list && list.length > 0) return list as AdminCategory[];
  return (USE_MOCK_FALLBACK ? mockCategories : []) as unknown as AdminCategory[];
}

export async function getAdminBanners() {
  const data = await apiFetch('/admin/banners');
  const list = unwrapList(data);
  if (list && list.length > 0) return list as AdminBanner[];
  return (USE_MOCK_FALLBACK ? mockBanners : []) as unknown as AdminBanner[];
}

export async function getAdminFaqs() {
  const data = await apiFetch('/admin/faqs');
  const list = unwrapList(data);
  if (list && list.length > 0) return list as AdminFaq[];
  return (USE_MOCK_FALLBACK ? mockFaqs : []) as unknown as AdminFaq[];
}

export async function getAdminPayments() {
  const data = await apiFetch('/admin/payments');
  const list = unwrapList(data);
  return (list ?? []) as AdminPayment[];
}

export async function getAdminBiddingRooms() {
  const data = await apiFetch('/rooms');
  const list = unwrapList(data);
  return (list ?? []) as AdminBiddingRoom[];
}

export async function getAdminTickets() {
  const data = await apiFetch('/tickets');
  const list = unwrapList(data);
  return (list ?? []) as AdminTicket[];
}

// ─── Seller ─────────────────────────────────────────────────────────────

export async function getSellerListings() {
  const data = await apiFetch('/sellers/me/products');
  const list = unwrapList(data);
  if (list && list.length > 0) return list.map(normalizeAuction);
  return [];
}

export async function getSellerPayments() {
  const data = await apiFetch('/sellers/payouts/me');
  const list = unwrapList(data);
  return (list ?? []) as AdminPayment[];
}

export async function getSellerSales() {
  const data = await apiFetch('/sellers/me/sales');
  if (data && typeof data === 'object' && Array.isArray((data as { products?: unknown }).products)) {
    return (data as { products: unknown[] }).products as SellerSale[];
  }
  return [];
}

export async function getSellerBiddingRooms() {
  const data = await apiFetch('/rooms');
  const list = unwrapList(data);
  return (list ?? []) as SellerBiddingRoom[];
}

export async function getSellerConversations() {
  const data = await apiFetch('/sellers/me/conversations');
  const list = unwrapList(data);
  return (list ?? []) as SellerConversation[];
}

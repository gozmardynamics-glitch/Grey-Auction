//interfaces
interface FeaturedProduct {
  id: string;
  title: string;
  specs: string;
  currentBid: number;
  image: string;
  category: string;
}

interface Brand {
  id: string;
  name: string;
  logo: string;
}

interface TrustBadge {
  icon: React.ReactNode;
  label: string;
}

interface Auction {
  id: string;
  title: string;
  description: string;
  currentBid: number;
  startingBid: number;
  totalBids: number;
  timeLeft: string;
  endTime: Date;
  imageUrl: string;
  category: string;
  sellerId: string;
  sellerName: string;
  status: 'active' | 'live' | 'new' | 'sold';
  trending?: boolean;
  featured?: boolean;
  // New fields
  isNew?: boolean;
  location?: {
    city: string;
    country: string;
    countryCode: string;
  };
  auctionType: 'bid' | 'buy';
  specs?: string;
  watchersCount?: number;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: Date;
  isWinning?: boolean;
}

interface CreateAuctionData {
  title: string;
  description: string;
  startingBid: number;
  endTime: Date;
  category: string;
  images: File[];
}

interface AuctionFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: Auction['status'];
  search?: string;
  sortBy?: 'endingSoon' | 'priceLow' | 'priceHigh' | 'mostBids';
}

interface Category {
  id: string;
  name: string;
  image: string;
  slug: string;
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

interface CosmeticCategory {
  id: string;
  title: string;
  backgroundColor: string;
  textColor: string;
  subCategories: SubCategory[];
  image: string;
  imageAlt: string;
  categorySlug: string;
}

interface HeroSlide {
  id: string;
  variant: 'split' | 'featured' | 'category';
  heading: string;
  description: string;
  primaryCta: string;
  secondaryCta?: string;
  product?: {
    title: string;
    specs: string;
    currentBid: string;
    image: string;
    category: string;
  };
  backgroundImage: string;
  currentBid?: string;
  startingBid?: string | number;
  endTime?: string;
  thumbnails?: string[];
}

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  image: string;
}

interface Filters {
  categories: string[];
  countries: string[];
  brands: string[];
  priceRange: [number, number];
}

interface AuctionDetail {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  name: string;
  emoji: string;
  items: FAQItem[];
}

//data
const categoryGradients: Record<string, string> = {
  transport: 'bg-primary/20',
  agriculture: 'bg-pink-100',
  construction: 'bg-primary/20',
  fashion: 'bg-pink-100',
  electronics: 'bg-primary/20',
  'real-estate': 'bg-pink-100',
  art: 'bg-primary/20',
  music: 'bg-pink-100',
  sports: 'bg-primary/20',
  books: 'bg-pink-100',
};

// ─── Exports ─────────────────────────────────────────────────────────────

export type {
  FeaturedProduct,
  Brand,
  TrustBadge,
  Auction,
  TimeRemaining,
  Bid,
  CreateAuctionData,
  AuctionFilters,
  Category,
  SubCategory,
  CosmeticCategory,
  HeroSlide,
  Testimonial,
  Filters,
  AuctionDetail,
  FAQItem,
  FAQCategory,
};

export { categoryGradients };

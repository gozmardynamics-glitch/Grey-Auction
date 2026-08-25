export interface Auction {
  id: string;
  slug?: string;
  title: string;
  description: string;
  currentBid: number;
  startingBid: number;
  totalBids: number;
  timeLeft: string;
  endTime: Date | string;
  endTimeIso?: string;
  imageUrl?: string;
  images?: string[];
  category: string;
  sellerId: string;
  sellerName: string;
  status: 'active' | 'live' | 'new' | 'sold';
  trending?: boolean;
  featured?: boolean;
  // New fields from website model
  isNew?: boolean;
  location?: {
    city: string;
    country: string;
    countryCode: string;
  };
  auctionType: 'bid' | 'buy';
  specs?: string;
  watchersCount?: number;
  hasReservePrice?: boolean;
  createdAt?: Date | string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: Date;
  isWinning?: boolean;
}

export interface AuctionFilters {
  categories: string[];
  countries: string[];
  brands: string[];
  priceRange: [number, number];
  sortBy?: 'default' | 'price-asc' | 'price-desc';
}

export interface CreateAuctionData {
  title: string;
  description: string;
  startingBid: number;
  endTime: Date;
  category: string;
  images: File[];
}

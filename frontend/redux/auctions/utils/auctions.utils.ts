import type { Auction, Bid } from '../models';

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format time remaining
export const formatTimeRemaining = (endTime: Date): string => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Check if auction is ending soon (less than 2 hours)
export const isEndingSoon = (endTime: Date): boolean => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();
  return diff > 0 && diff < 2 * 60 * 60 * 1000; // 2 hours in milliseconds
};

// Calculate bid increment
export const calculateBidIncrement = (currentBid: number): number => {
  if (currentBid < 100) return 10;
  if (currentBid < 1000) return 25;
  if (currentBid < 5000) return 50;
  if (currentBid < 10000) return 100;
  if (currentBid < 50000) return 250;
  if (currentBid < 100000) return 500;
  return 1000;
};

// Get minimum next bid
export const getMinimumNextBid = (currentBid: number): number => {
  return currentBid + calculateBidIncrement(currentBid);
};

// Check if user is winning bid
export const isWinningBid = (
  bid: Bid,
  currentBid: number,
  auctionId: string
): boolean => {
  return bid.auctionId === auctionId && bid.amount === currentBid;
};

// Sort auctions by different criteria
export const sortAuctions = (
  auctions: Auction[],
  sortBy: 'endingSoon' | 'priceLow' | 'priceHigh' | 'mostBids'
): Auction[] => {
  const sorted = [...auctions];

  switch (sortBy) {
    case 'endingSoon':
      return sorted.sort(
        (a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime()
      );
    case 'priceLow':
      return sorted.sort((a, b) => a.currentBid - b.currentBid);
    case 'priceHigh':
      return sorted.sort((a, b) => b.currentBid - a.currentBid);
    case 'mostBids':
      return sorted.sort((a, b) => b.totalBids - a.totalBids);
    default:
      return sorted;
  }
};

// Filter auctions by category
export const filterByCategory = (
  auctions: Auction[],
  category: string
): Auction[] => {
  if (!category || category === 'all') return auctions;
  return auctions.filter(
    (auction) => auction.category.toLowerCase() === category.toLowerCase()
  );
};

// Filter auctions by price range
export const filterByPriceRange = (
  auctions: Auction[],
  minPrice?: number,
  maxPrice?: number
): Auction[] => {
  return auctions.filter((auction) => {
    if (minPrice !== undefined && auction.currentBid < minPrice) return false;
    if (maxPrice !== undefined && auction.currentBid > maxPrice) return false;
    return true;
  });
};

// Search auctions
export const searchAuctions = (
  auctions: Auction[],
  searchTerm: string
): Auction[] => {
  if (!searchTerm.trim()) return auctions;

  const term = searchTerm.toLowerCase();
  return auctions.filter(
    (auction) =>
      auction.title.toLowerCase().includes(term) ||
      auction.description.toLowerCase().includes(term) ||
      auction.category.toLowerCase().includes(term) ||
      auction.sellerName.toLowerCase().includes(term)
  );
};

// Generate auction slug from title
export const generateAuctionSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim();
};

// Validate auction data
export const validateAuctionData = (data: {
  title: string;
  description: string;
  startingBid: number;
  endTime: Date;
  category: string;
}): string[] => {
  const errors: string[] = [];

  if (!data.title.trim()) errors.push('Title is required');
  if (data.title.length < 10)
    errors.push('Title must be at least 10 characters');
  if (data.title.length > 100)
    errors.push('Title must be less than 100 characters');

  if (!data.description.trim()) errors.push('Description is required');
  if (data.description.length < 50)
    errors.push('Description must be at least 50 characters');
  if (data.description.length > 2000)
    errors.push('Description must be less than 2000 characters');

  if (data.startingBid <= 0) errors.push('Starting bid must be greater than 0');
  if (data.startingBid < 1) errors.push('Starting bid must be at least $1');

  if (new Date(data.endTime) <= new Date())
    errors.push('End time must be in the future');

  if (!data.category.trim()) errors.push('Category is required');

  return errors;
};

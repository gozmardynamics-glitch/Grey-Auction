import {
  dummyAuctions,
  categories,
  faqCategories,
} from '@/app/[locale]/(website)/models/data';

import {
  DUMMY_AUCTIONS,
  DUMMY_BIDS,
  DUMMY_BUYERS,
  DUMMY_SELLERS,
  DUMMY_ADMINS,
  DUMMY_CATEGORIES,
  DUMMY_BANNERS,
  DUMMY_FAQS,
  DUMMY_PAYMENTS,
  DUMMY_BIDDING_ROOMS,
  DUMMY_TICKETS,
} from '@/app/[locale]/(domain)/admin/models/data';

import {
  DUMMY_LISTINGS,
  DUMMY_SALES,
  DUMMY_BIDDING_ROOMS as SELLER_BIDDING_ROOMS,
  DUMMY_CONVERSATIONS,
} from '@/app/[locale]/(domain)/seller/models';

import { SELLER_DUMMY_PAYMENTS } from '@/app/[locale]/(domain)/seller/models/data';

// Server-side data fetching functions.
// Currently return mock data — replace internals with fetch() when backend is ready.

export async function getAuctions() {
  return dummyAuctions;
}

export async function getAuctionBySlug(slug: string) {
  return dummyAuctions.find((a) => a.id === slug) ?? dummyAuctions[0];
}

export async function getFeaturedAuctions() {
  return dummyAuctions;
}

export async function getCategories() {
  return categories;
}

export async function getFaqCategories() {
  return faqCategories;
}

export async function getCartItems() {
  return dummyAuctions.slice(0, 2);
}

export async function getOrderItems() {
  return dummyAuctions.slice(0, 2).map((a) => ({
    name: a.title,
    price: a.currentBid,
  }));
}

export async function getWishlistItems() {
  return dummyAuctions;
}

// ─── Admin ──────────────────────────────────────────────────────────────

export async function getAdminAuctions() {
  return DUMMY_AUCTIONS;
}

export async function getAdminBids() {
  return DUMMY_BIDS;
}

export async function getAdminBuyers() {
  return DUMMY_BUYERS;
}

export async function getAdminSellers() {
  return DUMMY_SELLERS;
}

export async function getAdminAdmins() {
  return DUMMY_ADMINS;
}

export async function getAdminCategories() {
  return DUMMY_CATEGORIES;
}

export async function getAdminBanners() {
  return DUMMY_BANNERS;
}

export async function getAdminFaqs() {
  return DUMMY_FAQS;
}

export async function getAdminPayments() {
  return DUMMY_PAYMENTS;
}

export async function getAdminBiddingRooms() {
  return DUMMY_BIDDING_ROOMS;
}

export async function getAdminTickets() {
  return DUMMY_TICKETS;
}

// ─── Seller ─────────────────────────────────────────────────────────────

export async function getSellerListings() {
  return DUMMY_LISTINGS;
}

export async function getSellerPayments() {
  return SELLER_DUMMY_PAYMENTS;
}

export async function getSellerSales() {
  return DUMMY_SALES;
}

export async function getSellerBiddingRooms() {
  return SELLER_BIDDING_ROOMS;
}

export async function getSellerConversations() {
  return DUMMY_CONVERSATIONS;
}

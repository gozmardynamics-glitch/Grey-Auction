const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function apiFetch(path: string, options?: RequestInit): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

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

// ─── Website ─────────────────────────────────────────────────────────────

export async function getAuctions() {
  const data = await apiFetch('/auctions');
  return data ?? dummyAuctions;
}

export async function getAuctionBySlug(slug: string) {
  const data = await apiFetch(`/auctions/${slug}`);
  return data ?? dummyAuctions.find((a) => a.id === slug) ?? dummyAuctions[0];
}

export async function getFeaturedAuctions() {
  const data = await apiFetch('/auctions/featured');
  return data ?? dummyAuctions;
}

export async function getCategories() {
  const data = await apiFetch('/categories');
  return data ?? categories;
}

export async function getFaqCategories() {
  const data = await apiFetch('/faqs');
  return data ?? faqCategories;
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
  const data = await apiFetch('/wishlist');
  return data ?? dummyAuctions;
}

// ─── Admin ──────────────────────────────────────────────────────────────

export async function getAdminAuctions() {
  const data = await apiFetch('/admin/auctions');
  return data ?? DUMMY_AUCTIONS;
}

export async function getAdminBids() {
  const data = await apiFetch('/admin/bids');
  return data ?? DUMMY_BIDS;
}

export async function getAdminBuyers() {
  const data = await apiFetch('/admin/buyers');
  return data ?? DUMMY_BUYERS;
}

export async function getAdminSellers() {
  const data = await apiFetch('/admin/sellers');
  return data ?? DUMMY_SELLERS;
}

export async function getAdminAdmins() {
  const data = await apiFetch('/admin/admins');
  return data ?? DUMMY_ADMINS;
}

export async function getAdminCategories() {
  const data = await apiFetch('/admin/categories');
  return data ?? DUMMY_CATEGORIES;
}

export async function getAdminBanners() {
  const data = await apiFetch('/admin/banners');
  return data ?? DUMMY_BANNERS;
}

export async function getAdminFaqs() {
  const data = await apiFetch('/admin/faqs');
  return data ?? DUMMY_FAQS;
}

export async function getAdminPayments() {
  const data = await apiFetch('/admin/payments');
  return data ?? DUMMY_PAYMENTS;
}

export async function getAdminBiddingRooms() {
  const data = await apiFetch('/admin/rooms');
  return data ?? DUMMY_BIDDING_ROOMS;
}

export async function getAdminTickets() {
  const data = await apiFetch('/admin/tickets');
  return data ?? DUMMY_TICKETS;
}

// ─── Seller ─────────────────────────────────────────────────────────────

export async function getSellerListings() {
  const data = await apiFetch('/seller/listings');
  return data ?? DUMMY_LISTINGS;
}

export async function getSellerPayments() {
  const data = await apiFetch('/seller/payments');
  return data ?? SELLER_DUMMY_PAYMENTS;
}

export async function getSellerSales() {
  const data = await apiFetch('/seller/sales');
  return data ?? DUMMY_SALES;
}

export async function getSellerBiddingRooms() {
  const data = await apiFetch('/seller/rooms');
  return data ?? SELLER_BIDDING_ROOMS;
}

export async function getSellerConversations() {
  const data = await apiFetch('/seller/conversations');
  return data ?? DUMMY_CONVERSATIONS;
}

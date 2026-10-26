import { Plus } from 'lucide-react';

import { Button } from '@/shared/components/common';
import ListingTable from './components/listings_table';
import Link from 'next/link';
import { getSellerListings } from '@/lib/server/data';
import type { Listing } from '../models';
import type { Auction } from '@/redux/auctions/models';
import BulkUploadButton from './components/bulk_upload_button';

/** Backend lot status → the seller table's four buckets. */
const LISTING_STATUS: Record<string, Listing['status']> = {
  active: 'Active',
  approved: 'Active',
  draft: 'Pending',
  pending_approval: 'Pending',
  rejected: 'Pending',
  awaiting_seller_approval: 'Pending',
  sold: 'Closed',
  closed: 'Closed',
  expired: 'Closed',
  withdrawn: 'Closed',
};

function formatTimeLeft(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours >= 1) return `${hours}h ${Math.floor((ms % 3600000) / 60000)}m`;
  const minutes = Math.floor(ms / 60000);
  if (minutes >= 1) return `${minutes}m`;
  return '<1m';
}

/** Auction (lib/server shape) → the table's row model. */
function toListing(a: Auction): Listing {
  const end = a.endTime ? new Date(a.endTime) : null;
  const msLeft = end && !Number.isNaN(end.getTime()) ? end.getTime() - Date.now() : NaN;
  const isActive = a.status === 'active';
  const timeLeft =
    isActive && end && msLeft > 0
      ? formatTimeLeft(msLeft)
      : isActive
        ? 'Ended'
        : '—';
  return {
    id: a.id,
    // Consumers render the '#' themselves; including it here printed '##XXXX'.
    lotId: a.id ? a.id.slice(0, 8).toUpperCase() : '—',
    item: a.title,
    itemImage: a.imageUrl,
    reservePrice: a.hasReservePrice
      ? a.reservePrice != null
        ? String(a.reservePrice)
        : true
      : false,
    startingBid: a.startingBid,
    currentBid: a.currentBid > 0 ? a.currentBid : null,
    bids: a.totalBids,
    date: a.createdAt
      ? new Date(a.createdAt).toLocaleDateString('en-GB')
      : '—',
    timeLeft,
    status:
      isActive && end && msLeft > 0 && msLeft < 24 * 3600000
        ? 'Ending Soon'
        : LISTING_STATUS[a.status] ?? 'Pending',
  };
}

export default async function MyListings() {
  const auctions = await getSellerListings();
  const listings = (auctions as Auction[]).map(toListing);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
        <div className="flex items-center gap-2">
          <BulkUploadButton />
          <Button variant="default" asChild>
            <Link href="/seller/auctions/create_listing">
              <Plus className="h-4 w-4" />
              Create Listing
            </Link>
          </Button>
        </div>
      </div>

      <ListingTable data={listings} title="Listed Auctions" />
    </div>
  );
}

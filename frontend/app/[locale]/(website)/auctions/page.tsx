import { Suspense } from 'react';
import { Skeleton } from '@/shared/components/common';
import { getAuctions } from '@/lib/server/data';
import AuctionListingClient from './auction_listing_client';

function ListingFallback() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="mb-4 h-5 w-64 rounded-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default async function AuctionListingPage() {
  const auctions = await getAuctions();
  return (
    <Suspense fallback={<ListingFallback />}>
      <AuctionListingClient initialAuctions={auctions} />
    </Suspense>
  );
}
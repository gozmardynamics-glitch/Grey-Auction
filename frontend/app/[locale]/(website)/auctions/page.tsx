import { Suspense } from 'react';
import { Skeleton } from '@/shared/components/common';
import { getAuctions, getArmCounts } from '@/lib/server/data';
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

export default async function AuctionListingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : '';
  const subcategory =
    typeof params.subcategory === 'string' ? params.subcategory : '';

  // Structural step: when a URL deep link scopes the listing, the backend
  // filters server-side and serves the per-arm tab counts (one GROUP BY) —
  // the client no longer depends on the bounded fetch-everything aggregate
  // for the scoped render. The unfiltered view still loads the full active
  // set so sidebar browsing stays instant.
  const [auctions, armCounts] = await Promise.all([
    getAuctions({
      category: category || undefined,
      subCategory: subcategory || undefined,
    }),
    category ? getArmCounts(category) : Promise.resolve(null),
  ]);

  return (
    <Suspense fallback={<ListingFallback />}>
      <AuctionListingClient
        initialAuctions={auctions}
        initialCategory={category}
        initialArmCounts={armCounts}
      />
    </Suspense>
  );
}

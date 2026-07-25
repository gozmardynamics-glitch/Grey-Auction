import { Plus } from 'lucide-react';

import { Button } from '@/shared/components/common';
import ListingTable from './components/listings_table';
import Link from 'next/link';
import { getSellerListings } from '@/lib/server/data';

export default async function MyListings() {
  const listings = await getSellerListings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex gap-4 items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
        <Button variant="default" asChild>
          <Link href="/seller/auctions/create_listing">
            <Plus className="h-4 w-4" />
            Create Listing
          </Link>
        </Button>
      </div>

      <ListingTable data={listings} title="Listed Auctions" />
    </div>
  );
}

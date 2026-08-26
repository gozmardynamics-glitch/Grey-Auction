import { Plus } from 'lucide-react';

import { Button } from '@/shared/components/common';
import ListingTable from './components/listings_table';
import Link from 'next/link';
import { getSellerListings } from '@/lib/server/data';
import type { Listing } from '../models';
import BulkUploadButton from './components/bulk_upload_button';

export default async function MyListings() {
  // data.ts normalizes to the shared Auction shape; the table accepts a
  // structurally compatible Listing type.
  const listings = (await getSellerListings()) as unknown as Listing[];

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

'use client';

import { useMemo, useState } from 'react';
import { Paperclip } from 'lucide-react';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { Listing } from '../../models';
import { createListingColumns } from './listings_column';
import SellerAuctionDetailsModal from './auction_details_modal';

interface ListingTableProps {
  data: Listing[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

export default function ListingTable({
  data,
  tabFilters,
  title,
}: ListingTableProps) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const columns = useMemo(
    () =>
      createListingColumns((listing) => {
        setSelectedListing(listing);
        setDetailsOpen(true);
      }),
    []
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        tabFilters={tabFilters}
        title={title}
        emptyIcon={<Paperclip className="h-10 w-10" />}
        emptyTitle="No Listings Yet"
        emptyDescription="Create your first listing to start selling."
      />

      <SellerAuctionDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        listing={selectedListing}
      />
    </>
  );
}

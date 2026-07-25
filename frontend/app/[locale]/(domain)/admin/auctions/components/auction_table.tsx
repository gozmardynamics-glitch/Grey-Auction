'use client';

import { useMemo, useState } from 'react';
import { Paperclip } from 'lucide-react';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { Auction } from '../../models';
import { Columns } from './auctions_column';
import AuctionDetailsModal from './auction_details_modal';

interface AuctionTableProps {
  data: Auction[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

export default function AuctionTable({
  data,
  tabFilters,
  title,
}: AuctionTableProps) {
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const columns = useMemo(
    () =>
      Columns((auction) => {
        setSelectedAuction(auction);
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
        emptyTitle="No Auctions Available"
        emptyDescription="New auctions will appear here once sellers create listings."
      />

      <AuctionDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        auction={selectedAuction}
      />
    </>
  );
}

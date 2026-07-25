'use client';

import { useMemo, useState } from 'react';
import { Paperclip } from 'lucide-react';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { Bid, BidDetail } from '../../models';
import { Columns } from './bids_column';
import BidDetailsModal from './bids_details_modal';

interface BidsTableProps {
  data: Bid[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

export default function BidsTable({ data, tabFilters, title }: BidsTableProps) {
  const [selectedBid, setSelectedBid] = useState<BidDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const columns = useMemo(
    () =>
      Columns((bid) => {
        const bidDetail = {
          ...bid,
          category: 'General',
          endDate: bid.bidDate,
          seller: 'Unknown',
        };
        setSelectedBid(bidDetail);
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
        emptyTitle="No Bids Available"
        emptyDescription="New bids will appear here once sellers create listings."
      />

      <BidDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        bid={selectedBid}
      />
    </>
  );
}

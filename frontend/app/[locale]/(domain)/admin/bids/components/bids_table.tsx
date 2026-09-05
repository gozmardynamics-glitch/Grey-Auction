'use client';

import { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { Bid, BidDetail } from '../../models';
import { useBidsColumns } from './bids_column';
import BidDetailsModal from './bids_details_modal';

interface BidsTableProps {
  data: Bid[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

export default function BidsTable({ data, tabFilters, title }: BidsTableProps) {
  const t = useTranslations('admin.bids.empty');
  const [selectedBid, setSelectedBid] = useState<BidDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const onViewDetails = (bid: Bid) => {
    const bidDetail = {
      ...bid,
      category: 'General',
      endDate: bid.bidDate,
      seller: 'Unknown',
    };
    setSelectedBid(bidDetail);
    setDetailsOpen(true);
  };

  const columns = useBidsColumns(onViewDetails);

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        tabFilters={tabFilters}
        title={title}
        emptyIcon={<Paperclip className="h-10 w-10" />}
        emptyTitle={t('title')}
        emptyDescription={t('description')}
      />

      <BidDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        bid={selectedBid}
      />
    </>
  );
}

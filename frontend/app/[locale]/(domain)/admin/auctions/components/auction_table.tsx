'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Paperclip } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  DataTable,
  type TabFilter,
} from '@/shared/components/common';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import { Auction } from '../../models';
import { useAuctionsColumns } from './auctions_column';
import AuctionDetailsModal from './auction_details_modal';

interface AuctionTableProps {
  data: Auction[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

function AuctionMobileCard({
  auction,
  onViewDetails,
}: {
  auction: Auction;
  onViewDetails: (auction: Auction) => void;
}) {
  const t = useTranslations('admin.auctions.mobileCard');

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {auction.itemImage && (
            <Image
              src={auction.itemImage}
              alt={auction.item}
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded object-cover"
            />
          )}
          <span className="truncate font-medium">{auction.item}</span>
        </div>
        <Badge variant="outline" className={statusStyles[auction.status]}>
          {auction.status}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t('auctionId')}</dt>
          <dd className="font-medium">{auction.id}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('seller')}</dt>
          <dd className="truncate font-medium">{auction.seller}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('startingBid')}</dt>
          <dd className="font-medium">{formatCurrency(auction.startingBid)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('currentBid')}</dt>
          <dd className="font-medium">{formatCurrency(auction.currentBid)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('bids')}</dt>
          <dd className="font-medium">{auction.bids}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('endDate')}</dt>
          <dd className="font-medium">{auction.endDate}</dd>
        </div>
      </dl>

      <div className="pt-1">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onViewDetails(auction)}
        >
          {t('viewDetails')}
        </Button>
      </div>
    </div>
  );
}

export default function AuctionTable({
  data,
  tabFilters,
  title,
}: AuctionTableProps) {
  const t = useTranslations('admin.auctions.empty');
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleViewDetails = useCallback((auction: Auction) => {
    setSelectedAuction(auction);
    setDetailsOpen(true);
  }, []);

  const columns = useAuctionsColumns(handleViewDetails);

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        tabFilters={tabFilters}
        title={title}
        mobileCards={(auction) => (
          <AuctionMobileCard
            auction={auction}
            onViewDetails={handleViewDetails}
          />
        )}
        emptyIcon={<Paperclip className="h-10 w-10" />}
        emptyTitle={t('title')}
        emptyDescription={t('description')}
      />

      <AuctionDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        auction={selectedAuction}
      />
    </>
  );
}

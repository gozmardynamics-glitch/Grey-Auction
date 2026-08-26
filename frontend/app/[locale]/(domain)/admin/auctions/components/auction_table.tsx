'use client';

import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import { Paperclip } from 'lucide-react';

import {
  Badge,
  Button,
  DataTable,
  type TabFilter,
} from '@/shared/components/common';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import { Auction } from '../../models';
import { Columns } from './auctions_column';
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
          <dt className="text-xs text-muted-foreground">Auction ID</dt>
          <dd className="font-medium">{auction.id}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Seller</dt>
          <dd className="truncate font-medium">{auction.seller}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Starting Bid</dt>
          <dd className="font-medium">{formatCurrency(auction.startingBid)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Current Bid</dt>
          <dd className="font-medium">{formatCurrency(auction.currentBid)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Bids</dt>
          <dd className="font-medium">{auction.bids}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">End Date</dt>
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
          View details
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
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleViewDetails = useCallback((auction: Auction) => {
    setSelectedAuction(auction);
    setDetailsOpen(true);
  }, []);

  const columns = useMemo(() => Columns(handleViewDetails), [handleViewDetails]);

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

'use client';

import { Search, Hammer } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

import {
  Badge,
  DataTable,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Separator,
  Card,
} from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';
import { Listing } from '../../models';
import { statusStyles } from '@/shared/utils/helpers';
import { DUMMY_BID_HISTORY } from '../../models/data';
import { bidHistoryColumns } from './bid_history_columns';

// ---------- Sub-components ----------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

// ---------- Main Component ----------

interface AuctionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing | null;
}

export default function SellerAuctionDetailsModal({
  open,
  onOpenChange,
  listing,
}: AuctionDetailsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!listing) return null;

  const bidHistory = DUMMY_BID_HISTORY;
  const totalBids = bidHistory.length;

  const filtered = bidHistory.filter(
    (bid) =>
      bid.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[30%] max-h-[80%] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            Auction Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-6 pt-4">
          {/* Item Header */}
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              {listing.itemImage && (
                <Image
                  src={listing.itemImage}
                  alt={listing.item}
                  className="h-16 w-20 rounded-lg object-cover"
                  height={40}
                  width={40}
                />
              )}
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">
                  #{listing.lotId}
                </span>
                <p className="text-sm font-semibold">{listing.item}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[8px] font-bold text-blue-700">
                    S
                  </div>
                  Seller: Restoreweb 64.5%
                </div>
              </div>
            </div>
            <div>
              <Badge
                variant="default"
                className={statusStyles[listing.status]}
              >
                {listing.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Price Section */}
          <Card className="bg-primary/10 p-4">
            <h3 className="mb-3 text-sm font-semibold">Price</h3>
            <div className="grid grid-cols-2 gap-2">
              <InfoRow
                label="Starting Price:"
                value={formatCurrency(listing.startingBid)}
              />
              <InfoRow
                label="Bid Increment:"
                value={formatCurrency(1_000_000)}
              />
              <InfoRow
                label="Reserved Price:"
                value={
                  typeof listing.reservePrice === 'boolean'
                    ? listing.reservePrice
                      ? 'Yes'
                      : 'No'
                    : listing.reservePrice
                }
              />
              <InfoRow
                label="Reserve Price At:"
                value={formatCurrency(61_000_000)}
              />
              <InfoRow label="Allow Buy Now:" value="Yes" />
              <InfoRow label="Buy Now At:" value={formatCurrency(61_000_000)} />
            </div>
          </Card>

          <Separator />

          {/* Bid History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Bid History</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-[140px] pl-8 text-xs bg-background"
                  />
                </div>
                <span className="text-sm text-muted-foreground border px-2 py-1 rounded-md flex items-center gap-1">
                  <Hammer size={11} />
                  Bids:{' '}
                  <span className="font-semibold">
                    {String(totalBids).padStart(2, '0')}
                  </span>
                </span>
              </div>
            </div>

            <DataTable
              columns={bidHistoryColumns}
              data={filtered}
              globalFilter={searchQuery}
              pageSize={4}
              emptyTitle="No bids placed yet"
              emptyDescription="Bids will appear here once bidders start placing them."
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

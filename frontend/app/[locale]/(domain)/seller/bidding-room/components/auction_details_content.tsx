import Image from 'next/image';
import { Info, Gavel } from 'lucide-react';
import { Badge } from '@/shared/components/common';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import type { BiddingRoomAuction } from '../../models';

interface AuctionDetailsContentProps {
  auction: BiddingRoomAuction;
}

export default function AuctionDetailsContent({
  auction,
}: AuctionDetailsContentProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <h2 className="text-lg font-semibold">Auction Details</h2>

      {/* Auction Info */}
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={auction.image}
            alt={auction.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {auction.auctionNumber}
            </p>
            <Badge className={statusStyles[auction.status] ?? ''}>
              {auction.status}
            </Badge>
          </div>
          <p className="text-sm font-semibold">{auction.name}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>{auction.reserveStatus}</span>
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div className="space-y-3 rounded-lg border border-dashed p-4">
        <p className="text-sm font-semibold">Price</p>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <div>
            <span className="text-muted-foreground">Starting Price: </span>
            <span className="font-medium">
              {formatCurrency(auction.startingPrice)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Bid Increment: </span>
            <span className="font-medium">
              {formatCurrency(auction.bidIncrement)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Reserve Price: </span>
            <span className="font-medium">
              {auction.reservePrice ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Reserve Price @: </span>
            <span className="font-medium">
              {formatCurrency(auction.reservePriceAmount)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Allow Buy Now: </span>
            <span className="font-medium">
              {auction.allowBuyNow ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Buy Now @: </span>
            <span className="font-medium">
              {formatCurrency(auction.buyNowPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Bid History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Bid History</p>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Gavel className="h-4 w-4" />
            <span>Bids: {String(auction.bids).padStart(2, '0')}</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Bidder
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Bid Amount
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {auction.bidHistory.map((bid, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className="px-3 py-2.5">{bid.bidder}</td>
                  <td className="px-3 py-2.5">{formatCurrency(bid.amount)}</td>
                  <td className="px-3 py-2.5">{bid.type}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {bid.date}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={statusStyles[bid.status] ?? ''}
                    >
                      {bid.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

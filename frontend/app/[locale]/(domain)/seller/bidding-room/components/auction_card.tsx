import Image from 'next/image';
import { Badge } from '@/shared/components/common';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import type { BiddingRoomAuction } from '../../models';

interface AuctionCardProps {
  auction: BiddingRoomAuction;
  onClick?: () => void;
}

export default function AuctionCard({ auction, onClick }: AuctionCardProps) {
  return (
    <div
      className="rounded-xl border bg-card overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] bg-muted">
        <Image
          src={auction.image}
          alt={auction.name}
          fill
          className="object-cover"
        />
        <Badge
          className={`absolute top-3 left-3 ${statusStyles[auction.status] ?? ''}`}
        >
          {auction.status}
        </Badge>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-semibold truncate">{auction.name}</h3>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Current Bid</p>
          <p className="text-sm font-semibold">{formatCurrency(auction.currentBid)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="text-xs text-orange-600">{auction.reserveStatus}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            <span className="block">Bids</span>
            <span className="text-foreground font-medium">
              {String(auction.bids).padStart(2, '0')}
            </span>
          </div>
          <div className="text-right">
            <span className="block">Auction Ends</span>
            <span className="text-foreground font-medium">{auction.auctionEnds}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

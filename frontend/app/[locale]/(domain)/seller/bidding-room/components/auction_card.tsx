import Image from 'next/image';
import { Badge } from '@/shared/components/common';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import { Gavel, Clock } from 'lucide-react';
import type { BiddingRoomAuction } from '../../models';

interface AuctionCardProps {
  auction: BiddingRoomAuction;
  onClick?: () => void;
}

export default function AuctionCard({ auction, onClick }: AuctionCardProps) {
  return (
    <div
      className="group rounded-xl border bg-card overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <Image
          src={auction.image}
          alt={auction.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <Badge
          className={`absolute top-3 left-3 ${statusStyles[auction.status] ?? ''}`}
        >
          {auction.status}
        </Badge>
        {/* Bids count overlay */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          <Gavel className="h-3 w-3" />
          {auction.bids} bids
        </div>
      </div>
      <div className="p-3 space-y-2">
        <h3 className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
          {auction.name}
        </h3>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">Current Bid</p>
          <p className="text-sm font-semibold">{formatCurrency(auction.currentBid)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">Status</p>
          <p className="text-[10px] text-orange-600">{auction.reserveStatus}</p>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
          <div>
            <span className="block">Bids</span>
            <span className="text-foreground font-medium">
              {String(auction.bids).padStart(2, '0')}
            </span>
          </div>
          <div className="text-right">
            <span className="block flex items-center justify-end gap-0.5">
              <Clock className="h-3 w-3" />
              Auction Ends
            </span>
            <span className="text-foreground font-medium">{auction.auctionEnds}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

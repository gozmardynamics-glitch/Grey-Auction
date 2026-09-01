'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Share2, MapPin, Clock, Gavel, Eye } from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardFooter,
} from '@/shared/components/common';

import { Auction } from '../../models';
import { formatCurrency } from '@/shared/utils/helpers';
import { useCountdown } from '@/shared/hooks/useCountdown';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { toggleWishlist } from '@/redux/slices/wishlist.slice';

interface AuctionCardProps {
  auction: Auction;
  viewMode?: 'grid' | 'list';
  onBidClick?: (auctionId: string) => void;
  onBuyNowClick?: (auctionId: string) => void;
  onWishlistClick?: (auctionId: string) => void;
  onShareClick?: (auctionId: string) => void;
}

function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function StatusBadge({ status }: { status: Auction['status'] }) {
  const config = {
    active: { bg: 'bg-emerald-700', text: 'Live' },
    live: { bg: 'bg-red-700', text: 'Live Now' },
    new: { bg: 'bg-blue-700', text: 'New' },
    sold: { bg: 'bg-gray-700', text: 'Sold' },
  };
  const c = config[status];
  return (
    <div className={`${c.bg} rounded-full px-2 py-0.5 text-[9px] font-semibold text-white`}>
      {c.text}
    </div>
  );
}

export function AuctionCard({
  auction,
  viewMode = 'grid',
  onBidClick,
  onBuyNowClick,
  onWishlistClick,
  onShareClick,
}: AuctionCardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isWishlisted = wishlistItems.includes(auction.id);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeRemaining = useCountdown(auction.endTime);

  const handleCardClick = () => {
    router.push(`/auctions/${auction.id}`);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wasWishlisted = isWishlisted;
    dispatch(toggleWishlist(auction.id));
    onWishlistClick?.(auction.id);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    toast(wasWishlisted ? 'Removed from wishlist' : 'Added to wishlist', {
      icon: <Heart className={`h-4 w-4 ${wasWishlisted ? 'text-muted-foreground' : 'fill-red-500 text-red-500'}`} />,
    });
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShareClick?.(auction.id);
  };

  // ─── List View ───────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <Card className="group flex flex-row overflow-hidden border border-border/50 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <div className="relative h-auto w-[120px] shrink-0 overflow-hidden bg-muted sm:w-[180px]">
          <Image
            src={auction.imageUrl || auction.images?.[0] || '/placeholder.svg'}
            alt={auction.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 120px, 180px"
          />
          <div className="absolute left-1.5 top-1.5">
            <StatusBadge status={auction.status} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-2.5 sm:flex-row sm:items-center sm:gap-3 sm:p-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-[13px] font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{auction.title}</h3>
            {auction.specs && (
              <p className="text-[11px] text-muted-foreground line-clamp-1">{auction.specs}</p>
            )}
            {auction.location && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{auction.location.city}, {auction.location.country}</span>
                <span>{getCountryFlag(auction.location.countryCode)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Current bid:</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(auction.currentBid)}</span>
            </div>
          </div>

          <div className="mt-1.5 flex shrink-0 items-center gap-1.5 sm:mt-0 sm:self-end">
            {auction.status === 'active' ? (
              <>
                <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px] border-primary text-primary" onClick={() => onBuyNowClick?.(auction.id)}>Buy</Button>
                <Button variant="default" size="sm" className="h-7 px-2.5 text-[11px]" onClick={() => onBidClick?.(auction.id)}>Bid</Button>
              </>
            ) : auction.status === 'live' ? (
              <Button variant="default" size="sm" className="h-7 px-2.5 text-[11px] bg-red-500" onClick={() => onBidClick?.(auction.id)}>Join</Button>
            ) : auction.status === 'new' ? (
              <Button variant="default" size="sm" className="h-7 px-2.5 text-[11px]" onClick={() => onBidClick?.(auction.id)}>Bid</Button>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  // ─── Grid View — Fixed Layout ───────────────────────────────────
  return (
    <Card 
      className="group overflow-hidden border border-border/50 transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image — Taller for breathing room */}
      <div className="relative h-52 overflow-hidden bg-muted">
        <Image
          src={auction.imageUrl || auction.images?.[0] || '/placeholder.svg'}
          alt={auction.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
        />
        {/* Status badge — top-left */}
        <div className="absolute left-2 top-2">
          <StatusBadge status={auction.status} />
        </div>
      </div>

      {/* Info Strip — Timer + Icons on separate rows */}
      <div className="bg-muted/40 px-3 py-2 border-t border-border/30 space-y-1.5">
        {/* Row 1: Timer */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="tabular-nums">{String(timeRemaining.days).padStart(2, '0')}</span>
          <span className="text-muted-foreground text-[10px]">days</span>
          <span className="tabular-nums">{String(timeRemaining.hours).padStart(2, '0')}</span>
          <span className="text-muted-foreground text-[10px]">hrs</span>
          <span className="tabular-nums">{String(timeRemaining.minutes).padStart(2, '0')}</span>
          <span className="text-muted-foreground text-[10px]">min</span>
        </div>

        {/* Row 2: Icons */}
        <div className="flex items-center gap-3">
          {auction.totalBids > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Gavel className="h-3 w-3" />
              {auction.totalBids} bids
            </span>
          )}
          {auction.watchersCount && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Eye className="h-3 w-3" />
              {auction.watchersCount}
            </span>
          )}
          <div className="flex-1" />
          <button
            onClick={handleWishlistClick}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-muted ${isAnimating ? 'animate-heartPop' : ''}`}
          >
            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
          <button
            onClick={handleShareClick}
            aria-label="Share auction"
            className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-muted"
          >
            <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <CardContent className="flex-1 space-y-1 p-3">
        <h3 className="text-[13px] font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {auction.title}
        </h3>
        {auction.specs && (
          <p className="text-[11px] text-muted-foreground line-clamp-1">{auction.specs}</p>
        )}
        {auction.location && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
            <span className="truncate">{auction.location.city}, {auction.location.country}</span>
            <span className="text-xs">{getCountryFlag(auction.location.countryCode)}</span>
          </div>
        )}
        <div className="pt-1">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Current Bid</p>
          <p className="text-base font-bold text-foreground">{formatCurrency(auction.currentBid)}</p>
        </div>
      </CardContent>

      {/* Buttons — Smaller */}
      <CardFooter className="flex w-full gap-1.5 p-2.5 pt-0" onClick={(e) => e.stopPropagation()}>
        {auction.status === 'active' ? (
          <>
            <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px] border-primary text-primary hover:bg-primary/10" onClick={() => onBuyNowClick?.(auction.id)}>
              Buy Now
            </Button>
            <Button variant="default" size="sm" className="flex-1 h-7 text-[10px]" onClick={() => onBidClick?.(auction.id)}>
              Bid Now
            </Button>
          </>
        ) : auction.status === 'live' ? (
          <Button variant="default" size="sm" className="flex-1 h-7 text-[10px] bg-red-500 hover:bg-red-600" onClick={() => onBidClick?.(auction.id)}>
            Join Live
          </Button>
        ) : auction.status === 'new' ? (
          <Button variant="default" size="sm" className="flex-1 h-7 text-[10px]" onClick={() => onBidClick?.(auction.id)}>
            Bid Now
          </Button>
        ) : auction.status === 'sold' ? (
          <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px]" onClick={() => onBidClick?.(auction.id)}>
            View Details
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

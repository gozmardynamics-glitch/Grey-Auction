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
    active: { bg: 'bg-emerald-600', ring: 'ring-emerald-500/30', text: 'Live', dot: 'bg-emerald-300' },
    live:   { bg: 'bg-red-600',     ring: 'ring-red-500/30',     text: 'Live Now', dot: 'bg-red-300 animate-pulse' },
    new:    { bg: 'bg-blue-600',    ring: 'ring-blue-500/30',    text: 'New', dot: 'bg-blue-300' },
    sold:   { bg: 'bg-gray-600',    ring: 'ring-gray-500/30',    text: 'Sold', dot: 'bg-gray-300' },
  };
  const c = config[status];
  return (
    <div className={`${c.bg} ${c.ring} ring-2 rounded-full px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
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
    setTimeout(() => setIsAnimating(false), 350);
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
      <Card className="group flex flex-row overflow-hidden rounded-xl border border-border/60 soft-border hover-card-accent img-card-shadow cursor-pointer" onClick={handleCardClick}>
        <div className="relative h-auto w-[120px] shrink-0 overflow-hidden bg-muted sm:w-[180px]">
          <Image
            src={auction.imageUrl || auction.images?.[0] || '/placeholder.svg'}
            alt={auction.title}
            fill
            className="object-cover img-zoom"
            sizes="(max-width: 640px) 120px, 180px"
          />
          <div className="absolute left-2 top-2">
            <StatusBadge status={auction.status} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">{auction.title}</h3>
            {auction.specs && (
              <p className="text-xs text-muted-foreground line-clamp-1">{auction.specs}</p>
            )}
            {auction.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{auction.location.city}, {auction.location.country}</span>
                <span>{getCountryFlag(auction.location.countryCode)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Current bid:</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(auction.currentBid)}</span>
            </div>
          </div>

          <div className="mt-2 flex shrink-0 items-center gap-2 sm:mt-0 sm:self-end">
            {auction.status === 'active' ? (
              <>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs rounded-lg border-primary/30 text-primary hover:bg-primary/5" onClick={(e) => { e.stopPropagation(); onBuyNowClick?.(auction.id); }}>Buy</Button>
                <Button variant="default" size="sm" className="h-8 px-3 text-xs rounded-lg" onClick={(e) => { e.stopPropagation(); onBidClick?.(auction.id); }}>Bid</Button>
              </>
            ) : auction.status === 'live' ? (
              <Button variant="default" size="sm" className="h-8 px-3 text-xs rounded-lg bg-red-500 hover:bg-red-600" onClick={(e) => { e.stopPropagation(); onBidClick?.(auction.id); }}>Join</Button>
            ) : auction.status === 'new' ? (
              <Button variant="default" size="sm" className="h-8 px-3 text-xs rounded-lg" onClick={(e) => { e.stopPropagation(); onBidClick?.(auction.id); }}>Bid</Button>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  // ─── Grid View ───────────────────────────────────────────────────
  return (
    <Card
      className="group overflow-hidden rounded-xl border border-border/60 soft-border hover-card-accent img-card-shadow flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <Image
          src={auction.imageUrl || auction.images?.[0] || '/placeholder.svg'}
          alt={auction.title}
          fill
          className="object-cover img-zoom"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
        />
        {/* Gradient overlay at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Status badge */}
        <div className="absolute left-3 top-3">
          <StatusBadge status={auction.status} />
        </div>
        {/* Wishlist + Share — top-right */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={handleWishlistClick}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all duration-200 hover:bg-white hover:scale-110 ${isAnimating ? 'animate-heartPop' : ''}`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          <button
            onClick={handleShareClick}
            aria-label="Share auction"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all duration-200 hover:bg-white hover:scale-110"
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Timer strip */}
      <div className="bg-primary/[0.04] px-3.5 py-2 border-t border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Clock className="h-3.5 w-3.5 text-primary/70 shrink-0" />
            <span className="tabular-nums font-bold">{String(timeRemaining.days).padStart(2, '0')}</span>
            <span className="text-muted-foreground text-[10px]">d</span>
            <span className="tabular-nums font-bold">{String(timeRemaining.hours).padStart(2, '0')}</span>
            <span className="text-muted-foreground text-[10px]">h</span>
            <span className="tabular-nums font-bold">{String(timeRemaining.minutes).padStart(2, '0')}</span>
            <span className="text-muted-foreground text-[10px]">m</span>
          </div>
          <div className="flex items-center gap-3">
            {auction.totalBids > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Gavel className="h-3 w-3" /> {auction.totalBids}
              </span>
            )}
            {auction.watchersCount && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Eye className="h-3 w-3" /> {auction.watchersCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <CardContent className="flex-1 space-y-1.5 p-3.5">
        <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">
          {auction.title}
        </h3>
        {auction.specs && (
          <p className="text-xs text-muted-foreground line-clamp-1">{auction.specs}</p>
        )}
        {auction.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
            <span className="truncate">{auction.location.city}, {auction.location.country}</span>
            <span className="text-xs">{getCountryFlag(auction.location.countryCode)}</span>
          </div>
        )}
        <div className="pt-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Current Bid</p>
          <p className="text-lg font-extrabold text-foreground tracking-tight">{formatCurrency(auction.currentBid)}</p>
        </div>
      </CardContent>

      {/* Buttons */}
      <CardFooter className="flex w-full gap-2 p-3.5 pt-0" onClick={(e) => e.stopPropagation()}>
        {auction.status === 'active' ? (
          <>
            <Button variant="outline" size="sm" className="flex-1 h-9 text-xs rounded-lg border-primary/20 text-primary hover:bg-primary/5 font-medium" onClick={(e) => { e.stopPropagation(); onBuyNowClick?.(auction.id); }}>
              Buy Now
            </Button>
            <Button variant="default" size="sm" className="flex-1 h-9 text-xs rounded-lg font-semibold shadow-sm hover:shadow-md transition-all" onClick={(e) => { e.stopPropagation(); onBidClick?.(auction.id); }}>
              Bid Now
            </Button>
          </>
        ) : auction.status === 'live' ? (
          <Button variant="default" size="sm" className="flex-1 h-9 text-xs rounded-lg bg-red-500 hover:bg-red-600 font-semibold animate-pulse-glow" onClick={(e) => { e.stopPropagation(); onBidClick?.(auction.id); }}>
            Join Live
          </Button>
        ) : auction.status === 'new' ? (
          <Button variant="default" size="sm" className="flex-1 h-9 text-xs rounded-lg font-semibold" onClick={(e) => { e.stopPropagation(); onBidClick?.(auction.id); }}>
            Bid Now
          </Button>
        ) : auction.status === 'sold' ? (
          <Button variant="outline" size="sm" className="flex-1 h-9 text-xs rounded-lg font-medium" onClick={(e) => { e.stopPropagation(); onBidClick?.(auction.id); }}>
            View Details
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
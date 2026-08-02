'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Rating,
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

export function AuctionCard({
  auction,
  viewMode = 'grid',
  onBidClick,
  onBuyNowClick,
  onWishlistClick,
  onShareClick,
}: AuctionCardProps) {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isWishlisted = wishlistItems.includes(auction.id);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeRemaining = useCountdown(auction.endTime);

  const handleWishlistClick = () => {
    const wasWishlisted = isWishlisted;
    dispatch(toggleWishlist(auction.id));
    onWishlistClick?.(auction.id);

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (wasWishlisted) {
      toast('Removed from wishlist', {
        icon: <Heart className="h-4 w-4 text-muted-foreground" />,
      });
    } else {
      toast('Added to wishlist', {
        icon: <Heart className="h-4 w-4 fill-red-500 text-red-500" />,
      });
    }
  };

  const handleShareClick = () => {
    onShareClick?.(auction.id);
  };

  const handleBidClick = () => {
    onBidClick?.(auction.id);
  };

  const handleBuyNowClick = () => {
    onBuyNowClick?.(auction.id);
  };

  const getCountryFlag = (countryCode: string): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // ─── List View ───────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <Card className="group flex flex-row overflow-hidden transition-shadow duration-300 hover:shadow-lg">
        <div className="relative h-auto w-[130px] shrink-0 overflow-hidden bg-muted-foreground sm:w-[200px]">
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 130px, 200px"
          />

          <div className="absolute right-1.5 top-1.5 flex gap-1">
            <Button
              onClick={handleWishlistClick}
              variant="outline"
              size="icon"
              className={`h-6 w-6 rounded-full bg-background p-0 shadow transition-transform hover:scale-105 ${isAnimating ? 'animate-heartPop' : ''}`}
              aria-label="Add to wishlist"
            >
              <Heart className={`h-3 w-3 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </Button>
            <Button
              onClick={handleShareClick}
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-full bg-background p-0 shadow transition-transform hover:scale-105"
              aria-label="Share auction"
            >
              <Share2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>

          <div className="absolute bottom-1.5 left-1.5 rounded-md bg-background px-1.5 py-0.5 shadow">
            <div className="flex items-center gap-0.5 text-[7px] font-semibold text-muted-foreground">
              <span className="tabular-nums">{String(timeRemaining.days).padStart(2, '0')}</span>
              <span>d</span>
              <span className="tabular-nums">{String(timeRemaining.hours).padStart(2, '0')}</span>
              <span>h</span>
              <span className="tabular-nums">{String(timeRemaining.minutes).padStart(2, '0')}</span>
              <span>m</span>
            </div>
          </div>

          {auction.isNew && (
            <div className="absolute left-1.5 top-1.5 rounded-full bg-badge px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
              New
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-2.5 sm:flex-row sm:items-center sm:gap-4 sm:p-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <h3 className="text-[13px] font-bold text-primary line-clamp-1 sm:text-sm">{auction.title}</h3>
            {auction.specs && (
              <p className="text-[10px] leading-tight text-muted-foreground line-clamp-1 sm:text-[11px]">{auction.specs}</p>
            )}
            {auction.location && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-[11px]">
                <span className="truncate">{auction.location.city}, {auction.location.country}</span>
                <span className="text-xs shrink-0">{getCountryFlag(auction.location.countryCode)}</span>
              </div>
            )}
            {auction.sellerName && (
              <p className="text-[10px] text-muted-foreground sm:text-[11px]">{auction.sellerName}</p>
            )}
            {auction.rating != null && auction.reviewCount != null && (
              <Rating rating={auction.rating} reviewCount={auction.reviewCount} size="sm" />
            )}
            <div className="flex items-baseline gap-1 pt-0.5">
              <span className="text-[10px] text-muted-foreground sm:text-[11px]">Current bid:</span>
              <span className="text-xs font-bold text-foreground sm:text-sm">{formatCurrency(auction.currentBid)}</span>
            </div>
          </div>

          <div className="mt-2 flex shrink-0 items-center gap-2 sm:mt-0 sm:self-end">
            {auction.status === 'active' ? (
              <>
                <Button variant="outline" size="sm" className="border-primary text-primary text-xs" onClick={handleBuyNowClick}>Buy Now</Button>
                <Button variant="default" size="sm" className="text-xs" onClick={handleBidClick}>Bid Now</Button>
              </>
            ) : auction.status === 'live' ? (
              <Button variant="default" size="sm" className="text-xs" onClick={handleBidClick}>Join Live Auction</Button>
            ) : auction.status === 'new' ? (
              <Button variant="default" size="sm" className="text-xs" onClick={handleBidClick}>Bid Now</Button>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  // ─── Grid View ───────────────────────────────────────────────────
  return (
    <Card className="group overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="relative p-0">
        <div className="relative h-44 overflow-hidden bg-muted-foreground">
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {auction.isNew && (
            <div className="absolute left-2 top-2 rounded-full bg-badge px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              New
            </div>
          )}

          <div className="absolute right-2 top-2 flex gap-1.5">
            <Button
              onClick={handleWishlistClick}
              variant="outline"
              size="icon"
              className={`h-7 w-7 rounded-full bg-background shadow transition-transform duration-300 hover:scale-105 ${isAnimating ? 'animate-heartPop' : ''}`}
              aria-label="Add to wishlist"
            >
              <Heart
                className={`h-3.5 w-3.5 ${
                  isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                }`}
              />
            </Button>
            <Button
              onClick={handleShareClick}
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full bg-background shadow transition-transform duration-300 hover:scale-105"
              aria-label="Share auction"
            >
              <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>

          <div className="absolute bottom-1.5 left-1.5 rounded-lg bg-background px-1.5 py-0.5 shadow">
            <div className="flex items-center gap-0.5 text-[7px] font-semibold text-muted-foreground">
              <span className="tabular-nums">{String(timeRemaining.days).padStart(2, '0')}</span>
              <span>d</span>
              <span className="tabular-nums">{String(timeRemaining.hours).padStart(2, '0')}</span>
              <span>h</span>
              <span className="tabular-nums">{String(timeRemaining.minutes).padStart(2, '0')}</span>
              <span>m</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-0.5 p-2">
        <h3 className="text-[13px] font-bold text-primary line-clamp-1">{auction.title}</h3>
        {auction.specs && (
          <p className="text-[10px] leading-tight text-muted-foreground line-clamp-1">{auction.specs}</p>
        )}
        {auction.location && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="truncate">{auction.location.city}, {auction.location.country}</span>
            <span className="text-xs shrink-0">{getCountryFlag(auction.location.countryCode)}</span>
          </div>
        )}
        {auction.sellerName && (
          <p className="text-[10px] text-muted-foreground">{auction.sellerName}</p>
        )}
        {auction.rating != null && auction.reviewCount != null && (
          <Rating rating={auction.rating} reviewCount={auction.reviewCount} size="sm" />
        )}
        <div className="flex items-baseline gap-1 pt-0.5">
          <span className="text-[10px] text-muted-foreground">Current bid:</span>
          <span className="text-xs font-bold text-foreground">{formatCurrency(auction.currentBid)}</span>
        </div>
      </CardContent>

      <CardFooter className="flex w-full gap-1.5 p-2 pt-0">
        {auction.status === 'active' ? (
          <>
            <Button variant="outline" size="sm" className="flex-1 border-primary text-primary text-xs" onClick={handleBuyNowClick}>
              Buy Now
            </Button>
            <Button variant="default" size="sm" className="flex-1 text-xs" onClick={handleBidClick}>
              Bid Now
            </Button>
          </>
        ) : auction.status === 'live' ? (
          <Button variant="default" size="sm" className="flex-1 text-xs" onClick={handleBidClick}>
            Join Live Auction
          </Button>
        ) : auction.status === 'new' ? (
          <Button variant="default" size="sm" className="flex-1 text-xs" onClick={handleBidClick}>
            Bid Now
          </Button>
        ) : auction.status === 'sold' ? (
          <Button variant="default" size="sm" className="flex-1 text-xs" onClick={handleBidClick}>
            View
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

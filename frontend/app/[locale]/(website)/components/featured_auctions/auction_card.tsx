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
        {/* Image */}
        <div className="relative h-auto w-[120px] shrink-0 overflow-hidden bg-muted sm:w-[220px]">
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 120px, 220px"
          />

          {/* Action Icons */}
          <div className="absolute right-1.5 top-1.5 flex flex-col gap-1 sm:right-2 sm:top-2 sm:gap-1.5">
            <Button
              onClick={handleWishlistClick}
              variant="outline"
              size="icon"
              className={`rounded-full bg-background p-1 shadow-lg transition-transform hover:scale-105 sm:p-1.5 ${isAnimating ? 'animate-heartPop' : ''}`}
              aria-label="Add to wishlist"
            >
              <Heart
                className={`h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4 ${
                  isWishlisted
                    ? 'fill-red-500 text-red-500'
                    : 'text-muted-foreground'
                }`}
              />
            </Button>
            <Button
              onClick={handleShareClick}
              variant="outline"
              size="icon"
              className="rounded-full bg-background p-1 shadow-lg transition-transform hover:scale-105 sm:p-1.5"
              aria-label="Share auction"
            >
              <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Timer */}
          <div className="absolute bottom-1.5 left-1.5 rounded-lg bg-background px-1.5 py-0.5 shadow-lg sm:bottom-2 sm:left-2 sm:rounded-xl sm:px-2 sm:py-1">
            <div className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground sm:gap-1 sm:text-xs">
              <span className="tabular-nums">{String(timeRemaining.days).padStart(2, '0')}</span>
              <span>days</span>
              <span>:</span>
              <span className="tabular-nums">{String(timeRemaining.hours).padStart(2, '0')}</span>
              <span>hrs</span>
              <span>:</span>
              <span className="tabular-nums">{String(timeRemaining.minutes).padStart(2, '0')}</span>
              <span>mins</span>
            </div>
          </div>

          {/* Badges */}
          {auction.isNew && (
            <div className="absolute left-1.5 top-1.5 rounded-full bg-badge px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground sm:left-2 sm:top-2 sm:px-2 sm:text-xs">
              New
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
          <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
            <h3 className="text-sm font-bold text-primary line-clamp-1 sm:text-base">
              {auction.title}
            </h3>
            {auction.specs && (
              <p className="text-xs text-muted-foreground line-clamp-1 sm:text-sm">
                {auction.specs}
              </p>
            )}
            {auction.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground sm:gap-1.5 sm:text-sm">
                <span>
                  {auction.location.city}, {auction.location.country}
                </span>
                <span>{getCountryFlag(auction.location.countryCode)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 pt-0.5 sm:gap-2 sm:pt-1">
              <span className="text-xs text-muted-foreground sm:text-sm">
                Current bid:
              </span>
              <span className="text-xs font-bold text-foreground sm:text-sm">
                {formatCurrency(auction.currentBid)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-2 flex shrink-0 items-center gap-2 sm:mt-0 sm:self-end">
            {auction.status === 'active' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary sm:size-default"
                  onClick={handleBuyNowClick}
                >
                  Buy Now
                </Button>
                <Button variant="default" size="sm" onClick={handleBidClick}>
                  Bid Now
                </Button>
              </>
            ) : auction.status === 'live' ? (
              <Button variant="default" size="sm" onClick={handleBidClick}>
                Join Live Auction
              </Button>
            ) : auction.status === 'new' ? (
              <Button variant="default" size="sm" onClick={handleBidClick}>
                Bid Now
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  // ─── Grid View (existing) ────────────────────────────────────────
  return (
    <Card className="group overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="relative p-0">
        <div className="relative h-48 overflow-hidden bg-muted-foreground">
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {auction.isNew && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-badge px-2 py-1 text-xs font-semibold text-primary-foreground">
              New
            </div>
          )}

          <div className="absolute right-4 top-4 flex flex-col gap-2">
            <Button
              onClick={handleWishlistClick}
              variant="outline"
              size="icon"
              className={`rounded-full bg-background shadow-lg transition-transform duration-300 hover:scale-105 ${isAnimating ? 'animate-heartPop' : ''}`}
              aria-label="Add to wishlist"
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isWishlisted
                    ? 'fill-red-500 text-red-500'
                    : 'text-muted-foreground'
                }`}
              />
            </Button>
            <Button
              onClick={handleShareClick}
              variant="outline"
              size="icon"
              className="rounded-full bg-background shadow-lg transition-transform duration-300 hover:scale-105"
              aria-label="Share auction"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="absolute bottom-4 left-4 rounded-2xl bg-background px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-muted-foreground tabular-nums">
                {String(timeRemaining.days).padStart(2, '0')}
              </span>
              <span className="text-muted-foreground">days</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-muted-foreground tabular-nums">
                {String(timeRemaining.hours).padStart(2, '0')}
              </span>
              <span className="text-muted-foreground">hrs</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-muted-foreground tabular-nums">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </span>
              <span className="text-muted-foreground">mins</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 p-3">
        <h3 className="text-base font-bold text-primary line-clamp-1">
          {auction.title}
        </h3>
        {auction.specs && (
          <p className="text-xs text-muted-foreground">{auction.specs}</p>
        )}
        {auction.location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {auction.location.city}, {auction.location.country}
            </span>
            <span className="text-base">
              {getCountryFlag(auction.location.countryCode)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 pt-1">
          <p className="text-xs text-muted-foreground">Current bid:</p>
          <p className="text-xs font-bold text-foreground">
            {formatCurrency(auction.currentBid)}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex w-full gap-2 p-3 pt-0">
        {auction.status === 'active' ? (
          <>
            <Button
              variant="outline"
              size="default"
              className="flex-1 border-primary font-medium text-primary text-sm"
              onClick={handleBuyNowClick}
            >
              Buy Now
            </Button>
            <Button
              variant="default"
              size="default"
              className="flex-1 text-sm"
              onClick={handleBidClick}
            >
              Bid Now
            </Button>
          </>
        ) : auction.status === 'live' ? (
          <Button
            variant="default"
            size="default"
            className="flex-1 text-sm"
            onClick={handleBidClick}
          >
            Join Live Auction
          </Button>
        ) : auction.status === 'new' ? (
          <Button
            variant="default"
            size="default"
            className="flex-1 text-sm"
            onClick={handleBidClick}
          >
            Bid Now
          </Button>
        ) : auction.status === 'sold' ? (
          <Button
            variant="default"
            size="default"
            className="flex-1 text-sm"
            onClick={handleBidClick}
          >
            View
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

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

interface TrendingLotsCardsProps {
  auction: Auction;
  onBidClick?: (auctionId: string) => void;
  onWishlistClick?: (auctionId: string) => void;
  onShareClick?: (auctionId: string) => void;
}

export function TrendingLotsCards({
  auction,
  onBidClick,
  onWishlistClick,
  onShareClick,
}: TrendingLotsCardsProps) {
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

  const handleActionClick = () => {
    onBidClick?.(auction.id);
  };

  // Get country flag emoji
  const getCountryFlag = (countryCode: string): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <Card className="overflow-hidden shadow-none hover:shadow-lg transition-shadow duration-300 group">
      <CardHeader className="p-0 relative">
        {/* Image */}
        <div className="relative h-72 bg-muted-foreground overflow-hidden">
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* New Badge */}
          {auction.isNew && (
            <div className="absolute top-2 left-2 bg-badge text-primary-foreground px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              New
            </div>
          )}

          {/* Action Icons - Top Right */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {/* Wishlist */}
            <Button
              onClick={handleWishlistClick}
              variant="outline"
              size="icon"
              className={`bg-background rounded-full shadow-lg hover:scale-105 transition-transform duration-300 ${isAnimating ? 'animate-heartPop' : ''}`}
              aria-label="Add to wishlist"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isWishlisted
                    ? 'fill-red-500 text-red-500'
                    : 'text-muted-foreground'
                }`}
              />
            </Button>

            {/* Share */}
            <Button
              onClick={handleShareClick}
              variant="outline"
              size="icon"
              className="bg-background rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
              aria-label="Share auction"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Countdown Timer - Bottom Left */}
          <div className="absolute bottom-4 left-4 bg-background rounded-2xl px-3 py-2 shadow-lg">
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

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-xl font-bold text-primary line-clamp-1">
          {auction.title}
        </h3>

        {/* Specs */}
        {auction.specs && (
          <p className="text-sm text-muted-foreground truncate">
            {auction.specs}
          </p>
        )}

        {/* Location */}
        {auction.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {auction.location.city}, {auction.location.country}
            </span>
            <span className="text-lg">
              {getCountryFlag(auction.location.countryCode)}
            </span>
          </div>
        )}

        {/* Current Bid */}
        <div className="pt-2 flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Current bid:</p>
          <p className="text-sm font-bold text-foreground">
            {formatCurrency(auction.currentBid)}
          </p>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 w-full flex gap-2">
        {/* Action Button */}
        {auction.status === 'active' ? (
          <>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 border-primary text-primary font-medium"
              onClick={handleActionClick}
            >
              Buy Now
            </Button>

            <Button
              variant="default"
              size="lg"
              className="flex-1"
              onClick={handleActionClick}
            >
              Bid Now
            </Button>
          </>
        ) : auction.status === 'live' ? (
          <Button
            variant="default"
            size="lg"
            className="flex-1"
            onClick={handleActionClick}
          >
            Join Live Auction
          </Button>
        ) : auction.status === 'new' ? (
          <Button
            variant="default"
            size="lg"
            className="flex-1"
            onClick={handleActionClick}
          >
            Bid Now
          </Button>
        ) : auction.status === 'sold' ? (
          <Button
            variant="default"
            size="lg"
            className="flex-1"
            onClick={handleActionClick}
          >
            View
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

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
} from '@/shared/components/common';

import { Auction } from '../../models';
import { formatCurrency } from '@/shared/utils/helpers';
import { useCountdown } from '@/shared/hooks/useCountdown';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { toggleWishlist } from '@/redux/slices/wishlist.slice';

interface CategoriesCardProps {
  auction: Auction;
  onBidClick?: (auctionId: string) => void;
  onWishlistClick?: (auctionId: string) => void;
  onShareClick?: (auctionId: string) => void;
}

export function CategoriesCard({
  auction,
  onBidClick,
  onWishlistClick,
  onShareClick,
}: CategoriesCardProps) {
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group h-full">
      <div className="grid grid-cols-[140px_1fr] md:grid-cols-2 h-full">
        {/* Left Side - Image */}
        <div className="relative h-full min-h-[160px] md:min-h-full w-full rounded-l-md bg-muted-foreground">
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* New Badge */}
          {auction.isNew && (
            <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-purple-600 text-primary-foreground px-2 py-0.5 md:px-3 md:py-1.5 rounded-full text-xs font-semibold">
              New
            </div>
          )}

          {/* Watchers Count Badge */}
          {auction.watchersCount && auction.watchersCount > 0 && (
            <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-secondary text-muted-foreground px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-xs font-bold flex items-center gap-1">
              ⭐ {auction.watchersCount}
            </div>
          )}

          {/* Countdown Timer - Bottom Left */}
          <div className="absolute bottom-2 left-1 md:bottom-4 bg-background rounded-xl md:rounded-2xl p-1.5 md:p-2 shadow-lg">
            <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-semibold">
              <span className="text-secondary-foreground font-bold text-xs md:text-sm tabular-nums">
                {String(timeRemaining.days).padStart(2, '0')}
              </span>
              <span className="hidden md:inline text-muted-foreground">
                days
              </span>
              <span className="text-muted-foreground">:</span>
              <span className="text-secondary-foreground font-bold text-xs md:text-sm tabular-nums">
                {String(timeRemaining.hours).padStart(2, '0')}
              </span>
              <span className="hidden md:inline text-muted-foreground">
                hrs
              </span>
              <span className="text-muted-foreground">:</span>
              <span className="text-secondary-foreground font-bold text-xs md:text-sm tabular-nums">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </span>
              <span className="hidden md:inline text-muted-foreground">
                mins
              </span>
            </div>
          </div>
          {/* Action Icons */}
          <div className="flex gap-1 md:gap-2 absolute top-2 right-2 md:top-4 md:right-4 flex-col">
            {/* Wishlist */}
            <Button
              onClick={handleWishlistClick}
              variant="outline"
              className={`rounded-full h-7 w-7 md:h-10 md:w-10 transition-colors ${isAnimating ? 'animate-heartPop' : ''}`}
              aria-label="Add to wishlist"
            >
              <Heart
                className={`w-4 h-4 md:w-6 md:h-6 transition-colors ${
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
              className="rounded-full h-7 w-7 md:h-10 md:w-10 transition-colors"
              aria-label="Share auction"
            >
              <Share2 className="w-4 h-4 md:w-6 md:h-6 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="flex flex-col w-full">
          <CardContent className="space-y-1 md:space-y-4 p-3 md:py-6">
            {/* Header with Actions */}
            <div className="flex items-start justify-between gap-2 md:gap-4">
              <div className="flex-1 space-y-1 md:space-y-2">
                {/* Title */}
                <h3 className="text-sm md:text-2xl font-bold text-primary line-clamp-1 md:line-clamp-2">
                  {auction.title}
                </h3>

                {/* Specs */}
                {auction.specs && (
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                    {auction.specs}
                  </p>
                )}

                {/* Location */}
                {auction.location && (
                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
                    <span>
                      {auction.location.city}, {auction.location.country}
                    </span>
                    <span className="text-sm md:text-lg">
                      {getCountryFlag(auction.location.countryCode)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Bid */}
            <div className="flex items-center gap-1 md:gap-2 w-full">
              <p className="text-xs md:text-sm text-muted-foreground">
                Current bid:
              </p>
              <p className="text-sm md:text-xl font-bold text-foreground">
                {formatCurrency(auction.currentBid)}
              </p>
            </div>
          </CardContent>

          {/* Footer with Buttons */}
          <CardFooter className="flex flex-col gap-1 md:gap-1 items-center justify-end h-full p-3 pt-0 md:p-6 md:pt-0">
            {auction.status === 'active' && (
              <div className="flex gap-2 md:flex-col md:gap-1 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 md:hidden"
                  onClick={handleActionClick}
                >
                  Buy Now
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 md:hidden"
                  onClick={handleActionClick}
                >
                  Bid Now
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="hidden md:flex w-full"
                  onClick={handleActionClick}
                >
                  Buy Now
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  className="hidden md:flex w-full"
                  onClick={handleActionClick}
                >
                  Bid Now
                </Button>
              </div>
            )}

            {auction.status === 'live' && (
              <div className="w-full">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleActionClick}
                  className="w-full md:hidden"
                >
                  Bid Now
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleActionClick}
                  className="w-full hidden md:flex"
                >
                  Bid Now
                </Button>
              </div>
            )}

            {auction.status === 'new' && (
              <div className="w-full">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleActionClick}
                  className="w-full md:hidden"
                >
                  Bid Now
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleActionClick}
                  className="w-full hidden md:flex"
                >
                  Bid Now
                </Button>
              </div>
            )}

            {auction.status === 'sold' && (
              <div className="w-full">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleActionClick}
                  className="w-full md:hidden"
                >
                  View
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleActionClick}
                  className="w-full hidden md:flex"
                >
                  View
                </Button>
              </div>
            )}
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}

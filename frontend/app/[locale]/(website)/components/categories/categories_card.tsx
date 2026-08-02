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
  CountdownTimer,
} from '@/shared/components/common';

import { Auction } from '../../models';
import { formatCurrency } from '@/shared/utils/helpers';
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
      <div className="grid grid-cols-[120px_1fr] md:grid-cols-2 h-full">
        {/* Left Side - Image */}
        <div className="relative h-full min-h-[120px] md:min-h-full w-full bg-muted-foreground">
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* New Badge */}
          {auction.isNew && (
            <div className="absolute left-1.5 top-1.5 md:left-3 md:top-3 rounded-full bg-purple-600 px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground md:px-2 md:py-1 md:text-xs">
              New
            </div>
          )}

          {/* Watchers Count Badge */}
          {auction.watchersCount && auction.watchersCount > 0 && (
            <div className="absolute left-1.5 top-8 md:left-3 md:top-10 flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground md:px-2 md:py-1 md:text-xs">
              {auction.watchersCount}
            </div>
          )}

          {/* Countdown Timer - Bottom Left */}
          <div className="absolute bottom-1.5 left-1.5 md:bottom-2 md:left-2 rounded-lg bg-background px-1.5 py-0.5 shadow md:rounded-xl md:px-2 md:py-1">
            <CountdownTimer endTime={auction.endTime} size="sm" className="text-[6px] md:text-[7px]" />
          </div>

          {/* Action Icons - Bottom Right */}
          <div className="absolute bottom-1.5 right-1.5 flex gap-1 md:bottom-2 md:right-2 md:gap-1.5">
            <Button
              onClick={handleWishlistClick}
              variant="outline"
              className={`h-7 w-7 rounded-full transition-colors hover:scale-105 md:h-8 md:w-8 ${isAnimating ? 'animate-heartPop' : ''}`}
              aria-label="Add to wishlist"
            >
              <Heart
                className={`h-3.5 w-3.5 md:h-4 md:w-4 ${
                  isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                }`}
              />
            </Button>
            <Button
              onClick={handleShareClick}
              variant="outline"
              className="h-7 w-7 rounded-full transition-colors hover:scale-105 md:h-8 md:w-8"
              aria-label="Share auction"
            >
              <Share2 className="h-3.5 w-3.5 text-muted-foreground md:h-4 md:w-4" />
            </Button>
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="flex flex-col w-full">
          <CardContent className="space-y-0.5 p-2 md:p-3">
            <h3 className="text-[13px] font-bold text-primary line-clamp-1 md:text-sm md:line-clamp-2">
              {auction.title}
            </h3>
            {auction.specs && (
              <p className="text-[10px] leading-tight text-muted-foreground line-clamp-1 md:text-[11px]">
                {auction.specs}
              </p>
            )}
            {auction.location && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground md:text-[11px]">
                <span className="truncate">
                  {auction.location.city}, {auction.location.country}
                </span>
                <span className="text-xs shrink-0">{getCountryFlag(auction.location.countryCode)}</span>
              </div>
            )}
            <div className="flex items-baseline gap-1 pt-0.5">
              <span className="text-[10px] text-muted-foreground md:text-[11px]">Current bid:</span>
              <span className="text-xs font-bold text-foreground md:text-sm">
                {formatCurrency(auction.currentBid)}
              </span>
            </div>
          </CardContent>

          <CardFooter className="mt-auto flex gap-1.5 p-2 pt-0 md:p-3 md:pt-0">
            {auction.status === 'active' ? (
              <>
                <Button variant="outline" size="sm" className="flex-1 border-primary text-primary text-xs md:text-sm" onClick={handleActionClick}>
                  Buy Now
                </Button>
                <Button variant="default" size="sm" className="flex-1 text-xs md:text-sm" onClick={handleActionClick}>
                  Bid Now
                </Button>
              </>
            ) : auction.status === 'live' ? (
              <Button variant="default" size="sm" className="flex-1 text-xs md:text-sm" onClick={handleActionClick}>
                Join Live
              </Button>
            ) : auction.status === 'new' ? (
              <Button variant="default" size="sm" className="flex-1 text-xs md:text-sm" onClick={handleActionClick}>
                Bid Now
              </Button>
            ) : auction.status === 'sold' ? (
              <Button variant="default" size="sm" className="flex-1 text-xs md:text-sm" onClick={handleActionClick}>
                View
              </Button>
            ) : null}
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}

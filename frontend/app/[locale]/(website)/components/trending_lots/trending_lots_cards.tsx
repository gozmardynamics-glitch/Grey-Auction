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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      <CardHeader className="p-0 relative">
        <div className="relative h-44 bg-muted-foreground overflow-hidden">
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
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

      <CardContent className="p-2 space-y-0.5">
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

      <CardFooter className="p-2 pt-0 w-full flex gap-1.5">
        {auction.status === 'active' ? (
          <>
            <Button variant="outline" size="sm" className="flex-1 border-primary text-primary text-xs" onClick={handleActionClick}>
              Buy Now
            </Button>
            <Button variant="default" size="sm" className="flex-1 text-xs" onClick={handleActionClick}>
              Bid Now
            </Button>
          </>
        ) : auction.status === 'live' ? (
          <Button variant="default" size="sm" className="flex-1 text-xs" onClick={handleActionClick}>
            Join Live Auction
          </Button>
        ) : auction.status === 'new' ? (
          <Button variant="default" size="sm" className="flex-1 text-xs" onClick={handleActionClick}>
            Bid Now
          </Button>
        ) : auction.status === 'sold' ? (
          <Button variant="default" size="sm" className="flex-1 text-xs" onClick={handleActionClick}>
            View
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

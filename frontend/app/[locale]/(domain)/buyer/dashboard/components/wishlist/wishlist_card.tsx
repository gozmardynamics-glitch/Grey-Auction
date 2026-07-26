'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Hammer, Heart } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, Button, Card } from '@/shared/components/common';

import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { toggleWishlist } from '@/redux/slices/wishlist.slice';
import { formatCurrency } from '@/shared/utils/helpers';
import { WishlistItem } from '../../../models';

export default function WishlistCard({ item }: { item: WishlistItem }) {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isWishlisted = wishlistItems.includes(item.id);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleWishlistClick = () => {
    const wasWishlisted = isWishlisted;
    dispatch(toggleWishlist(item.id));

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

  return (
    <Card className="rounded-lg border bg-background overflow-hidden">
      {/* Image Section */}
      <div className="relative aspect-16/10 bg-muted">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover"
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {item.badge && (
            <Badge
              className={cn(
                'text-xs font-medium',
                item.badge === 'New'
                  ? 'bg-tertiary text-primary-foreground hover:bg-tertiary'
                  : 'bg-red-500 text-primary-foreground hover:bg-red-500'
              )}
            >
              {item.badge}
            </Badge>
          )}
        </div>
        {/* Heart Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleWishlistClick}
          className={cn(
            'absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white',
            isAnimating && 'animate-heartPop'
          )}
        >
          <Heart
            className={cn(
              'h-4 w-4',
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
            )}
          />
        </Button>

        {/* Countdown */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[90%] max-w-[280px]">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-base text-muted-foreground bg-background w-full px-2 py-1.5 sm:p-2 rounded-2xl">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <span className="font-semibold text-foreground">
                {String(item.countdown.days).padStart(2, '0')}
              </span>
              <span>Days</span>
            </div>
            <span>:</span>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <span className="font-semibold text-foreground">
                {String(item.countdown.hours).padStart(2, '0')}
              </span>
              <span>Hours</span>
            </div>
            <span>:</span>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <span className="font-semibold text-foreground">
                {String(item.countdown.mins).padStart(2, '0')}
              </span>
              <span>Mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 space-y-1.5">
        {/* Title */}
        <h3 className="text-xs font-semibold leading-tight truncate">
          {item.title}
        </h3>

        {/* Specs */}
        <p className="text-[10px] text-muted-foreground truncate">{item.specs}</p>

        {/* Current Bid */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Current Bid</p>
            <p className="text-sm font-semibold truncate">
              {formatCurrency(item.currentBid)}
              <span className="text-xs font-normal text-muted-foreground">
                /{formatCurrency(item.maxBid)}
              </span>
            </p>
          </div>
          <Button variant="default" className="rounded-full shrink-0" size="lg">
            <Hammer />
          </Button>
        </div>
      </div>
    </Card>
  );
}

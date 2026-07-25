// components/cart/cart_item_card.tsx
'use client';

import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';
import { Auction } from '../models';

interface CartItemCardProps {
  auction: Auction;
  onRemove?: (auctionId: string) => void;
}

export function CartItemCard({ auction, onRemove }: CartItemCardProps) {
  const getCountryFlag = (countryCode: string): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="flex items-center gap-6 border-b border-border py-6 last:border-b-0">
      {/* Image */}
      <div className="relative h-[120px] w-[180px] shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image
          src={auction.imageUrl}
          alt={auction.title}
          fill
          className="object-cover"
          sizes="180px"
        />
        {auction.currentBid && (
          <span className="absolute left-2 top-2 rounded bg-foreground/80 px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
            Lot: # {auction.currentBid}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-base font-semibold text-primary line-clamp-1">
          {auction.title}
        </h3>
        {auction.specs && (
          <p className="text-sm text-muted-foreground">{auction.specs}</p>
        )}
        {auction.location && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>
              {auction.location.city}, {auction.location.country}
            </span>
            <span>{getCountryFlag(auction.location.countryCode)}</span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="shrink-0 text-right">
        <p className="text-lg font-bold text-foreground">
          {formatCurrency(auction.currentBid)}
        </p>
      </div>

      {/* Remove */}
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-2 text-muted-foreground"
        onClick={() => onRemove?.(auction.id)}
      >
        <Trash2 className="h-4 w-4" />
        Remove Item
      </Button>
    </div>
  );
}

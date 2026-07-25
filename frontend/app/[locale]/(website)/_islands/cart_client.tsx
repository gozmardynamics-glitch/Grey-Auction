'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/common/card';
import { Button, EmptyState } from '@/shared/components/common';
import { Separator } from '@/shared/components/common/separator';
import { CartItemCard } from '../cart/cart_item_card';

import { formatCurrency } from '@/shared/utils/helpers';
import type { Auction } from '../models';

interface CartClientProps {
  initialItems: Auction[];
}

export default function CartClient({ initialItems }: CartClientProps) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<Auction[]>(initialItems);

  const handleRemove = (auctionId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== auctionId));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.currentBid, 0);
  const total = subtotal;

  if (cartItems.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse auctions and add items to your cart."
        action={
          <Button
            variant="default"
            onClick={() => router.push('/auctions')}
          >
            Browse Auctions
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex items-start gap-8">
      {/* Cart Items */}
      <div className="min-w-0 flex-1">
        {/* Table Header */}
        <div className="mb-2 flex items-center gap-6 px-0">
          <span className="w-[180px] shrink-0 text-sm font-semibold text-muted-foreground">
            Product
          </span>
          <div className="flex-1" />
          <span className="shrink-0 text-sm font-semibold text-muted-foreground">
            Price
          </span>
          <div className="w-[130px] shrink-0" />
        </div>

        <Separator className="mb-2" />

        {/* Items */}
        {cartItems.map((item) => (
          <CartItemCard
            key={item.id}
            auction={item}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {/* Cart Totals */}
      <div>
        <div className="pb-4">
          <h2 className="text-base font-semibold">Cart Totals</h2>
        </div>
        <Card className="w-[300px] shrink-0 shadow-none">
          <CardContent className="space-y-4 mt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Subtotal
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Total
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatCurrency(total)}
              </span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push('/checkout')}
            >
              Proceed to Checkout
            </Button>

            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                This will end the auction for this item.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

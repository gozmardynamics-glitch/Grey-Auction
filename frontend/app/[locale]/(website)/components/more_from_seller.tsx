'use client';

import { useRouter } from 'next/navigation';
import { dummyAuctions } from '@/app/[locale]/(website)/models/data';
import { TrendingLotsCards } from './trending_lots/trending_lots_cards';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  EmptyState,
} from '@/shared/components/common';
import { Store } from 'lucide-react';

interface MoreFromSellerProps {
  sellerId: string;
  sellerName: string;
  currentAuctionId: string;
}

export default function MoreFromSeller({
  sellerId,
  sellerName,
  currentAuctionId,
}: MoreFromSellerProps) {
  const router = useRouter();

  // Filter auctions by same seller, excluding current
  const sellerAuctions = dummyAuctions.filter(
    (auction) => auction.sellerId === sellerId && auction.id !== currentAuctionId
  );

  if (sellerAuctions.length === 0) {
    return null; // Don't show section if no other items from seller
  }

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <Carousel
        opts={{
          align: 'start',
          slidesToScroll: 1,
        }}
        className="w-full"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                More from {sellerName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {sellerAuctions.length} other item{sellerAuctions.length !== 1 ? 's' : ''} from this seller
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CarouselPrevious className="static translate-x-0 translate-y-0" />
            <CarouselNext className="static translate-x-0 translate-y-0" />
          </div>
        </div>

        <CarouselContent className="-ml-4">
          {sellerAuctions.map((auction) => (
            <CarouselItem
              key={auction.id}
              className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/5"
            >
              <TrendingLotsCards
                auction={auction}
                onBidClick={(id) => router.push(`/auctions/${id}`)}
                onWishlistClick={(id) => console.log('Wishlist:', id)}
                onShareClick={(id) => console.log('Share:', id)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}

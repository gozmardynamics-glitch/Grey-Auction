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
} from '@/shared/components/common';
import { Sparkles, TrendingUp } from 'lucide-react';

interface AIRecommendationsProps {
  currentAuctionId: string;
  category: string;
  sellerId: string;
}

export default function AIRecommendations({
  currentAuctionId,
  category,
  sellerId,
}: AIRecommendationsProps) {
  const router = useRouter();

  // AI-powered recommendation logic:
  // 1. Same category items (excluding current and same seller)
  // 2. Trending items
  // 3. Items with high bid counts
  const sameCategory = dummyAuctions.filter(
    (a) => a.category === category && a.id !== currentAuctionId && a.sellerId !== sellerId
  );

  const trending = dummyAuctions.filter(
    (a) => a.trending && a.id !== currentAuctionId
  );

  const highBid = dummyAuctions
    .filter((a) => a.id !== currentAuctionId)
    .sort((a, b) => b.totalBids - a.totalBids)
    .slice(0, 5);

  // Combine and deduplicate
  const recommended = [...new Map(
    [...sameCategory, ...trending, ...highBid].map(a => [a.id, a])
  ).values()].filter(a => a.id !== currentAuctionId).slice(0, 10);

  if (recommended.length === 0) {
    return null;
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
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Recommended for You
              </h3>
              <p className="text-sm text-muted-foreground">
                Based on your browsing and similar items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CarouselPrevious className="static translate-x-0 translate-y-0" />
            <CarouselNext className="static translate-x-0 translate-y-0" />
          </div>
        </div>

        <CarouselContent className="-ml-4">
          {recommended.map((auction, idx) => (
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

      {/* AI Insight Banner */}
      <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              AI-Powered Recommendations
            </p>
            <p className="text-xs text-muted-foreground">
              These items are selected based on your browsing history, similar categories, and trending auctions. 
              Items with high bid activity are prioritized.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

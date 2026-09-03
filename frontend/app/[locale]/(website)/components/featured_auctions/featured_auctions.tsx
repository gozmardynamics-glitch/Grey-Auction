'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  EmptyState,
} from '@/shared/components/common';
import { Auction } from '../../models';
import { dummyAuctions } from '../../models/data';
import { AuctionCard } from './auction_card';
import { useStaggerReveal } from '@/shared/hooks/useScrollReveal';

interface FeaturedAuctionsProps {
  auctions?: Auction[];
  selectedCategory?: string | null;
  auction?: Auction;
  onBidClick?: (auctionId: string) => void;
  onWishlistClick?: (auctionId: string) => void;
  onShareClick?: (auctionId: string) => void;
}

export default function FeaturedAuctions({
  auctions,
  selectedCategory,
  auction,
  onBidClick,
  onWishlistClick,
  onShareClick,
}: FeaturedAuctionsProps) {
  const filteredAuctions = selectedCategory
    ? (auctions || dummyAuctions).filter((a) => a.category === selectedCategory)
    : auctions || dummyAuctions;

  const categoryLabel = selectedCategory
    ? `${(selectedCategory || 'Featured').charAt(0).toUpperCase() + (selectedCategory || 'Featured').slice(1)} Auctions`
    : 'Featured Auctions';

  const staggerRef = useStaggerReveal<HTMLDivElement>(filteredAuctions.length, { staggerMs: 100 });

  // Single auction view
  if (auction) {
    return (
      <div className="mt-4 space-y-8">
        <h2 className="text-xl font-bold text-foreground">Featured Auction</h2>
        <div className="mx-auto max-w-2xl">
          <AuctionCard
            auction={auction}
            onBidClick={onBidClick}
            onWishlistClick={onWishlistClick}
            onShareClick={onShareClick}
          />
        </div>
      </div>
    );
  }

  // Empty state
  if (!filteredAuctions || filteredAuctions.length === 0) {
    return (
      <EmptyState
        title={selectedCategory ? `No auctions found in ${selectedCategory}` : 'No auctions available'}
        description="Check back soon for new listings"
      />
    );
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-secondary font-semibold mb-1">Discover</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">{categoryLabel}</h2>
        </div>
      </div>

      <Carousel
        opts={{ align: 'start', loop: false }}
        className="w-full"
      >
        <CarouselContent className="-ml-3" ref={staggerRef}>
          {filteredAuctions.map((item) => (
            <CarouselItem key={item.id} className="pl-3 basis-[280px] sm:basis-[300px] md:basis-[320px]">
              <div className="reveal">
                <AuctionCard
                  auction={item}
                  onBidClick={onBidClick}
                  onWishlistClick={onWishlistClick}
                  onShareClick={onShareClick}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:flex justify-end gap-2 mt-4">
          <CarouselPrevious className="static translate-y-0 h-9 w-9 rounded-lg border-border/60" />
          <CarouselNext className="static translate-y-0 h-9 w-9 rounded-lg border-border/60" />
        </div>
        <div className="flex md:hidden justify-center gap-2 mt-4">
          <CarouselPrevious className="static translate-y-0 h-9 w-9 rounded-lg" />
          <CarouselNext className="static translate-y-0 h-9 w-9 rounded-lg" />
        </div>
      </Carousel>
    </section>
  );
}
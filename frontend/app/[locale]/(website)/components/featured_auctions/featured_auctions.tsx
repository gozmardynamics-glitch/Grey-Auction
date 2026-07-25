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
    ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Auctions`
    : 'Featured Auctions';

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
        title={
          selectedCategory
            ? `No auctions found in ${selectedCategory}`
            : 'No auctions available'
        }
        description={
          selectedCategory
            ? 'Try selecting a different category or check back later.'
            : 'Check back soon for new auctions.'
        }
      />
    );
  }

  // Paginated grid: 4 columns × 2 rows = 8 per page
  const itemsPerPage = 8;
  const pages: Auction[][] = [];
  for (let i = 0; i < filteredAuctions.length; i += itemsPerPage) {
    pages.push(filteredAuctions.slice(i, i + itemsPerPage));
  }

  return (
    <Carousel
      opts={{
        align: 'start',
        slidesToScroll: 1,
      }}
      className="w-full"
    >
      {/* Header with nav buttons */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{categoryLabel}</h2>
        <div className="flex items-center gap-2">
          <CarouselPrevious className="static translate-x-0 translate-y-0" />
          <CarouselNext className="static translate-x-0 translate-y-0" />
        </div>
      </div>

      <CarouselContent className="-ml-4">
        {pages.map((page, pageIndex) => (
          <CarouselItem key={pageIndex} className="basis-full pl-4">
            <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3 xl:grid-cols-4">
              {page.map((auction) => (
                <div
                  key={auction.id}
                  className="min-w-[280px] shrink-0 md:min-w-0 md:shrink"
                >
                  <AuctionCard
                    auction={auction}
                    onBidClick={onBidClick}
                    onWishlistClick={onWishlistClick}
                    onShareClick={onShareClick}
                  />
                </div>
              ))}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

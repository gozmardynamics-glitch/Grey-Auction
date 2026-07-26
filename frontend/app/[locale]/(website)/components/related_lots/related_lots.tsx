'use client';

import { useRouter } from 'next/navigation';
import { dummyAuctions } from '@/app/[locale]/(website)/models/data';
import { TrendingLotsCards } from '../trending_lots/trending_lots_cards';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  EmptyState,
} from '@/shared/components/common';

interface RelatedLotsProps {
  selectedCategory: string | null;
}

export default function RelatedLots({ selectedCategory }: RelatedLotsProps) {
  const router = useRouter();
  const filteredAuctions = selectedCategory
    ? dummyAuctions.filter((auction) => auction.category === selectedCategory)
    : dummyAuctions;

  if (!filteredAuctions.length) {
    return (
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          title="No auctions found"
          description={
            selectedCategory
              ? `There are no auctions in the ${selectedCategory} category yet.`
              : 'No auctions available at the moment.'
          }
        />
      </section>
    );
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
        {/* Header with nav buttons */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-foreground">
            Related Lots
          </h3>
          <div className="flex items-center gap-2">
            <CarouselPrevious className="static translate-x-0 translate-y-0" />
            <CarouselNext className="static translate-x-0 translate-y-0" />
          </div>
        </div>

        <CarouselContent className="-ml-4">
          {filteredAuctions.map((auction) => (
            <CarouselItem
              key={auction.id}
              className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/5"
            >
              <TrendingLotsCards
                auction={auction}
                onBidClick={(id) => router.push(`/auctions/${id}`)}
                onWishlistClick={(id) =>
                  console.log('Wishlist clicked:', id)
                }
                onShareClick={(id) => console.log('Share clicked:', id)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  EmptyState,
} from '@/shared/components/common';

import {
  categories,
  dummyAuctions,
} from '@/app/[locale]/(website)/models/data';
import { CategoriesCard } from '../categories/categories_card';

interface CategoriesSectionProps {
  selectedCategory: string | null;
  onCategorySelect: (categorySlug: string | null) => void;
}

export default function CategoriesCarousel({
  selectedCategory,
  onCategorySelect,
}: CategoriesSectionProps) {
  const router = useRouter();
  const visibleCategories = categories.slice(0, 10);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const filteredAuctions = selectedCategory
    ? dummyAuctions.filter((auction) => auction.category === selectedCategory)
    : [];

  const itemsPerPage = isMobile ? 3 : 10;
  const pages: (typeof filteredAuctions)[] = [];
  for (let i = 0; i < filteredAuctions.length; i += itemsPerPage) {
    pages.push(filteredAuctions.slice(i, i + itemsPerPage));
  }

  return (
    <section className="py-4">
      <Carousel
        opts={{
          align: 'start',
          slidesToScroll: 1,
        }}
        className="w-full"
      >
        {/* Header with nav buttons */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Categories</h2>
          <div className="flex items-center gap-2">
            <CarouselPrevious className="static translate-x-0 translate-y-0" />
            <CarouselNext className="static translate-x-0 translate-y-0" />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
          {visibleCategories.map((category) => {
            const isSelected = selectedCategory === category.slug;
            return (
              <Button
                key={category.id}
                variant="outline"
                size="xl"
                onClick={() =>
                  onCategorySelect(isSelected ? null : category.slug)
                }
                className={`flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-3 transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-secondary-foreground'
                    : 'bg-muted hover:bg-primary-foreground'
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 p-1.5">
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={36}
                    height={36}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span
                  className={`whitespace-nowrap text-base font-medium ${
                    isSelected
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {category.name}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Category Auctions Carousel */}
        {selectedCategory && filteredAuctions.length > 0 && (
          <CarouselContent className="-ml-4">
            {pages.map((page, pageIndex) => (
              <CarouselItem key={pageIndex} className="basis-[95%] pl-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                  {page.map((auction) => (
                    <CategoriesCard
                      key={auction.id}
                      auction={auction}
                      onBidClick={(id) => router.push(`/auctions/${id}`)}
                      onWishlistClick={(id) =>
                        console.log('Wishlist clicked:', id)
                      }
                      onShareClick={(id) => console.log('Share clicked:', id)}
                    />
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        )}

        {/* Empty state */}
        {selectedCategory && filteredAuctions.length === 0 && (
          <EmptyState
            title="No auctions found"
            description="There are no auctions in this category yet."
          />
        )}
      </Carousel>
    </section>
  );
}

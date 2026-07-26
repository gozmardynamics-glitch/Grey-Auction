'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/shared/components/common';
import { trustedBrands } from '../models/data';

function BrandLogo({ brand }: { brand: (typeof trustedBrands)[number] }) {
  const isPlaceholder = brand.logo === '/car.svg';

  if (!isPlaceholder) {
    return (
      <div className="relative w-24 h-16 rounded-xl">
        <Image
          src={brand.logo}
          alt={brand.name}
          fill
          className="object-contain"
          sizes="100px"
        />
      </div>
    );
  }

  return (
    <div
      className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${brand.color ?? 'bg-gray-500'}`}
    >
      {brand.initials ?? brand.name.charAt(0)}
    </div>
  );
}

export default function TrustedBrands() {
  const plugin = useRef(
    Autoplay({
      delay: 2000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  );

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div>
        {/* Header */}
        <div className="md:text-center mb-12">
          <h2 className="text-xl md:text-3xl font-bold text-foreground mb-2">
            Trusted Brands
          </h2>
          <p className="text-muted-foreground text-md">
            Join live auctions in three easy steps and start bidding on your
            favorite items.
          </p>
        </div>

        {/* Infinite Carousel */}
        <Carousel
          opts={{
            align: 'start',
            loop: true,
            dragFree: true,
          }}
          plugins={[plugin.current]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {/* Duplicate brands for seamless infinite scroll */}
            {[...trustedBrands, ...trustedBrands].map((brand, index) => (
              <CarouselItem
                key={`${brand.id}-${index}`}
                className="pl-4 basis-1/3 sm:basis-1/4 md:basis-1/6 lg:basis-[12.5%]"
              >
                <div className="flex items-center justify-center p-2 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
                  <BrandLogo brand={brand} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

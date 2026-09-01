'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Autoplay from 'embla-carousel-autoplay';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/shared/components/common';

import { heroSlides } from '../models/data';
import { SplitSlide } from './banners/split_slide';
import { FeaturedSlide } from './banners/featured_slide';
import { CategorySlide } from './banners/category_slide';

export default function Banner() {
  const plugin = useMemo(
    () => Autoplay({ delay: 5000, stopOnInteraction: true }),
    []
  );
  const router = useRouter();

  const handlePrimaryClick = () => {
    router.push('/auctions');
  };

  const handleSecondaryClick = () => {
    router.push('/seller');
  };

  return (
    <section className="">
      <div className="w-full">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[plugin]}
          className="w-full"
        >
          <CarouselContent>
            {heroSlides.map((slide, index) => (
              <CarouselItem key={slide.id}>
                {slide.variant === 'split' && (
                  <SplitSlide
                    slide={slide}
                    onPrimary={handlePrimaryClick}
                    onSecondary={handleSecondaryClick}
                    isFirstSlide={index === 0}
                  />
                )}
                {slide.variant === 'featured' && (
                  <FeaturedSlide
                    slide={slide}
                    onPrimary={handlePrimaryClick}
                    isFirstSlide={index === 0}
                  />
                )}
                {slide.variant === 'category' && (
                  <CategorySlide
                    slide={slide}
                    onPrimary={handlePrimaryClick}
                    onSecondary={handleSecondaryClick}
                    isFirstSlide={index === 0}
                  />
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

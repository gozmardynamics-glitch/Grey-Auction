'use client';

import { useMemo } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/shared/components/common';
import TestimonialCard from './customer_stories/testimonials_card';
import { testimonials } from '../models/data';

export default function CustomerStories() {
  const plugin = useMemo(
    () =>
      Autoplay({
        delay: 4000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    []
  );

  return (
    <section className="bg-background">
      <div>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between md:gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl max-w-md font-bold text-foreground mb-2">
              Our Customer Story
            </h2>
          </div>
          <div>
            <p className="text-muted-foreground text-sm max-w-md md:text-right">
              Real experiences from users who bid, sell, and win every day.
            </p>
          </div>
        </div>

        {/* Infinite Carousel */}
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[plugin]}
          onMouseEnter={plugin.stop}
          onMouseLeave={plugin.reset}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <CarouselItem
                key={`${testimonial.id}-${index}`}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <TestimonialCard
                  quote={testimonial.quote}
                  name={testimonial.name}
                  role={testimonial.role}
                  company={testimonial.company}
                  image={testimonial.image}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

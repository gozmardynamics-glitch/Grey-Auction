'use client';

import Image from 'next/image';
import { Button, Card, CardContent } from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';
import { useCountdown } from '@/shared/hooks/useCountdown';
import { Auction, categoryGradients } from '../models/index';

interface FeaturedActiveAuctionsProps {
  auctions: Auction[];
}

const getGradientForCategory = (category: string): string => {
  return categoryGradients[category.toLowerCase()] || 'bg-primary/10';
};

export default function FeaturedActiveAuctions({
  auctions,
}: FeaturedActiveAuctionsProps) {
  const featuredAuctions = auctions.slice(0, 2);

  if (featuredAuctions.length === 0) {
    return null;
  }

  return (
    <section className="">
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {featuredAuctions.map((auction, index) => (
            <FeaturedAuctionCard
              key={auction.id}
              auction={auction}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedAuctionCard({
  auction,
  index,
}: {
  auction: Auction;
  index: number;
}) {
  const timeRemaining = useCountdown(auction.endTime);
  const gradientClass = getGradientForCategory(auction.category);

  return (
    <Card
      className={`${gradientClass} rounded-xl border-0 shadow-none relative overflow-hidden min-h-[400px] text-foreground`}
    >
      <CardContent className="h-full flex flex-col justify-center w-full p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center ">
          {/* Left Side - Product Info */}
          <div className="space-y-12">
            {/* New Badge (only for first card or based on isNew) */}
            {auction.isNew && index === 1 && (
              <div className="inline-block">
                <span className="bg-[#9B51E0] px-3 py-1 rounded-full text-xs font-semibold">
                  New
                </span>
              </div>
            )}

            {/* Title */}
            <h3 className="text-2xl lg:text-3xl font-bold leading-tight">
              {auction.title}
            </h3>

            {/* Starting/Current Bid */}
            <div className="space-y-1 ">
              {index === 0 && <p className="text-sm">Starting bid:</p>}
              {index === 1 && <p className="text-sm">Current bid:</p>}
              <p className="text-3xl font-bold">
                {formatCurrency(auction.currentBid)}
              </p>
            </div>

            {/* Countdown Timer (only for first card) */}
            {index === 0 && (
              <div className="flex items-center gap-4">
                <div className="text-center bg-background backdrop-blur-sm rounded-lg px-6 py-4">
                  <div className="text-2xl font-bold tabular-nums">
                    {String(timeRemaining.days).padStart(2, '0')}
                  </div>
                  <div className="text-xs">Days</div>
                </div>
                <div className="text-2xl font-bold">:</div>
                <div className="text-center bg-background backdrop-blur-sm rounded-lg px-6 py-4">
                  <div className="text-2xl font-bold tabular-nums">
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </div>
                  <div className="text-xs">Hours</div>
                </div>
                <div className="text-2xl font-bold">:</div>
                <div className="text-center bg-background backdrop-blur-sm rounded-lg px-6 py-4">
                  <div className="text-2xl font-bold tabular-nums">
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-xs">Mins</div>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <Button
              variant="default"
              size="xl"
              className="bg-primary text-primary-foreground hover:bg-background/90 font-semibold"
            >
              Bid Now
            </Button>
          </div>

          {/* Right Side - Product Image */}
          <div className="relative h-64 md:h-80">
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={auction.imageUrl}
                alt={auction.title}
                fill
                className="object-contain drop-shadow-2xl"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-background/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      </CardContent>
    </Card>
  );
}

'use client';

import Image from 'next/image';
import { MapPin, Clock, Gavel, Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button, Card, CardContent, CountdownTimer } from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';
import { Auction, categoryGradients } from '../models/index';

interface FeaturedActiveAuctionsProps {
  auctions: Auction[];
}

const getGradientForCategory = (category: string): string => {
  const gradients: Record<string, string> = {
    transport: 'from-blue-600 to-blue-800',
    agriculture: 'from-green-600 to-green-800',
    construction: 'from-amber-600 to-amber-800',
    fashion: 'from-pink-600 to-pink-800',
    electronics: 'from-indigo-600 to-indigo-800',
    'real-estate': 'from-teal-600 to-teal-800',
    art: 'from-purple-600 to-purple-800',
    music: 'from-rose-600 to-rose-800',
    sports: 'from-orange-600 to-orange-800',
    books: 'from-slate-600 to-slate-800',
  };
  return gradients[category.toLowerCase()] || 'from-primary/80 to-primary';
};

function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  const gradientClass = getGradientForCategory(auction.category);

  return (
    <Card className={`relative overflow-hidden rounded-2xl border-0 min-h-[420px] text-white bg-gradient-to-br ${gradientClass}`}>
      <CardContent className="h-full flex flex-col justify-between w-full p-6 lg:p-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left Side - Product Info */}
          <div className="space-y-4">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              {auction.isNew && (
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  New
                </span>
              )}
              {auction.status === 'active' && (
                <span className="inline-flex items-center gap-1 bg-emerald-700/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Live
                </span>
              )}
              {auction.totalBids > 0 && (
                <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium">
                  <Gavel className="h-3 w-3" />
                  {auction.totalBids} bids
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-2xl lg:text-3xl font-bold leading-tight">
              {auction.title}
            </h3>

            {/* Location */}
            {auction.location && (
              <div className="flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="h-4 w-4" />
                <span>{auction.location.city}, {auction.location.country}</span>
                <span>{getCountryFlag(auction.location.countryCode)}</span>
              </div>
            )}

            {/* Bid info */}
            <div className="space-y-1">
              <p className="text-sm text-white/70">
                {index === 0 ? 'Starting bid:' : 'Current bid:'}
              </p>
              <p className="text-3xl font-bold">
                {formatCurrency(auction.currentBid)}
              </p>
            </div>

            {/* Countdown Timer */}
            {index === 0 && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-white/70" />
                <CountdownTimer endTime={auction.endTime} size="lg" />
              </div>
            )}

            {/* Watchers */}
            {auction.watchersCount && (
              <div className="flex items-center gap-1.5 text-sm text-white/70">
                <Eye className="h-4 w-4" />
                {auction.watchersCount} people watching
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="default"
                size="xl"
                className="bg-white text-foreground hover:bg-white/90 font-semibold shadow-lg"
              >
                Bid Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href={`/auctions/${auction.id}`}>
                <Button
                  variant="outline"
                  size="xl"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold"
                >
                  View Details
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Side - Product Image */}
          <div className="relative h-64 md:h-80">
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={auction.imageUrl ?? '/placeholder.svg'}
                alt={auction.title}
                fill
                className="object-contain drop-shadow-2xl"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      </CardContent>
    </Card>
  );
}

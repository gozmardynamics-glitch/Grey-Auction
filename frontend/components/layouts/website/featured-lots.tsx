'use client';

import Image from 'next/image';
import Link from 'next/link';
import { dummyAuctions } from '@/app/[locale]/(website)/models/data';

export default function FeaturedLots() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
      {dummyAuctions.slice(0, 3).map((auction) => (
        <Link
          key={auction.id}
          href={`/auctions/${auction.id}`}
          className="group overflow-hidden rounded-lg border"
        >
          <div className="relative h-24 bg-muted">
            <Image
              src={auction.imageUrl ?? '/placeholder.svg'}
              alt={auction.title}
              width={100}
              height={100}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="p-2">
            <p className="line-clamp-1 text-xs font-medium">
              {auction.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {auction.location?.city},{' '}
              {auction.location?.country}
            </p>
            <p className="mt-1 text-xs font-bold">
              ₦{auction.currentBid.toLocaleString()}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/redux/store';

import { Button, EmptyState } from '@/shared/components/common';

import { AuctionCard } from '../components/featured_auctions/auction_card';
import LatestAuctionsBanner from '../components/latest_auctions';
import type { Auction } from '../models';

interface WishlistClientProps {
  auctions: Auction[];
}

export default function WishlistClient({ auctions }: WishlistClientProps) {
  const [counting, setCounting] = useState(false);
  const [_click, setClick] = useState(false);

  const handleStart = () => {
    setClick(true);
    setCounting(true);
  };
  const handleStop = () => {
    setClick(false);
    setCounting(false);
  };

  useEffect(() => {
    if (!counting) return;

    const interval = setInterval(() => {
      setCounting((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, [counting]);

  const router = useRouter();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  const wishlistedAuctions = auctions.filter((auction) =>
    wishlistItems.includes(auction.id)
  );

  const handleBidClick = (auctionId: string) => {
    router.push(`/auctions/${auctionId}`);
  };

  return (
    <>
      <h1 className="text-2xl font-bold mt-8">Wishlist</h1>
      <section className="space-y-4">
        {wishlistedAuctions.length > 0 ? (
          wishlistedAuctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              viewMode="list"
              onBidClick={handleBidClick}
            />
          ))
        ) : (
          <EmptyState
            title="Your wishlist is empty"
            description="Browse auctions and add items you like."
          />
        )}
      </section>
      <footer>
        <LatestAuctionsBanner />
      </footer>

      <section>
        <div className=" p-8 border rounded-full w-fit">
          <h1 className="text-2xl font-bold">Stopwatch</h1>
          <div className="flex flex-col items-center gap-2">
            <p>{counting ? 'Counting...' : 'Not Counting'}</p>
            <div className="flex items-center gap-2">
              <Button onClick={handleStart}>Start</Button>
              <Button variant="destructive" onClick={handleStop}>
                Pause
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

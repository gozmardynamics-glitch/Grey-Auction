'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { setWishlist } from '@/redux/slices/wishlist.slice';

import { Button, EmptyState } from '@/shared/components/common';

import { AuctionCard } from '../components/featured_auctions/auction_card';
import LatestAuctionsBanner from '../components/latest_auctions';
import type { Auction } from '../models';

interface WishlistClientProps {
  auctions: Auction[];
}

export default function WishlistClient({ auctions }: WishlistClientProps) {
  const [counting, setCounting] = useState(false);
  const [, setClick] = useState(false);

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
  const dispatch = useAppDispatch();
  // The server already returns exactly this user's watched lots, so filtering
  // by Redux here would hide everything until AuthSync finished hydrating.
  // Instead, seed Redux from the authoritative server list.
  const wishlistedAuctions = auctions;

  useEffect(() => {
    dispatch(setWishlist(auctions.map((auction) => auction.id)));
  }, [auctions, dispatch]);

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

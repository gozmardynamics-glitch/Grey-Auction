'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Gavel } from 'lucide-react';

import { DataTable, EmptyState, Skeleton } from '@/shared/components/common';
import { apiFetch } from '@/shared/utils/api-client';

import { myBidsColumns } from './my_bids_column';
import { MY_BIDS_FILTER_TABS } from '../../../models/data';
import type { BidStatus, MyBid } from '../../../models';

interface BidderBid {
  id: string;
  productId: string;
  amount: number;
  isWinningBid: boolean;
  createdAt: string;
  product?: {
    title?: string;
    slug?: string;
    images?: string[];
    currentBid?: number;
    status?: string;
  } | null;
  room?: { name?: string } | null;
}

const CLOSED_LOT_STATUSES = new Set([
  'sold',
  'closed',
  'expired',
  'withdrawn',
  'rejected',
  'awaiting_seller_approval',
]);

function toBidStatus(bid: BidderBid): BidStatus {
  const status = bid.product?.status;
  const isClosed = status ? CLOSED_LOT_STATUSES.has(status) : false;
  if (isClosed) return bid.isWinningBid ? 'Won' : 'Lost';
  return bid.isWinningBid ? 'Winning' : 'Outbid';
}

function toMyBid(bid: BidderBid): MyBid {
  const product = bid.product;
  return {
    id: bid.id,
    image: product?.images?.[0] || '/placeholder.svg',
    auction: bid.room?.name || product?.title || 'Auction item',
    lot: product?.slug || '—',
    currentBid: product?.currentBid ?? bid.amount,
    yourBid: bid.amount,
    time: bid.createdAt
      ? new Date(bid.createdAt).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—',
    status: toBidStatus(bid),
  };
}

export default function MyBidsTable() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [bids, setBids] = useState<MyBid[] | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        // Bidding history is private: this route only accepts the caller's own id.
        const json = await apiFetch<{ data: BidderBid[] }>(
          `users/${encodeURIComponent(userId)}/bids`
        );
        if (cancelled) return;
        setBids((json.data ?? []).map(toMyBid));
      } catch {
        if (!cancelled) setBids([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  const rows = bids ?? (status === 'unauthenticated' ? [] : null);

  if (rows === null) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<Gavel className="h-10 w-10" />}
          title="No Bids Yet"
          description="Your bids on auctions will appear here. Start bidding to track your activity."
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <DataTable
        columns={myBidsColumns}
        data={rows}
        tabFilters={MY_BIDS_FILTER_TABS}
        searchPlaceholder="Search for lots"
        emptyIcon={<Gavel className="h-10 w-10" />}
        emptyTitle="No Bids Yet"
        emptyDescription="Your bids on auctions will appear here. Start bidding to track your activity."
      />
    </div>
  );
}

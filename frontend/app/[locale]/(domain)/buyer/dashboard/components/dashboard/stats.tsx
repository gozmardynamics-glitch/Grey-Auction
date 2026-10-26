'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Clock, Megaphone, TrendingDown, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Card,
  CardContent,
  EmptyState,
  Skeleton,
} from '@/shared/components/common';
import { apiFetch } from '@/shared/utils/api-client';

interface BidderBid {
  id: string;
  productId: string;
  amount: number;
  isWinningBid: boolean;
  product?: {
    status?: string;
    endTime?: string;
  } | null;
}

interface Counts {
  activeBids: number;
  winning: number;
  outbid: number;
  endingSoon: number;
}

const ENDING_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Lot states after which the auction no longer runs, so it is not "active". */
const CLOSED_LOT_STATUSES = new Set([
  'sold',
  'closed',
  'expired',
  'withdrawn',
  'rejected',
  'awaiting_seller_approval',
]);

const statCards = [
  { label: 'activeBids', icon: Megaphone, color: 'text-blue-600 bg-blue-100', key: 'activeBids' },
  { label: 'winning', icon: Trophy, color: 'text-green-600 bg-tertiary/10', key: 'winning' },
  { label: 'outbid', icon: TrendingDown, color: 'text-red-600 bg-red-100', key: 'outbid' },
  { label: 'endingSoon', icon: Clock, color: 'text-orange-600 bg-orange-100', key: 'endingSoon' },
] as const;

export default function BuyerStats() {
  const t = useTranslations('buyer.home');
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        // There is no aggregate endpoint: the owner-only bid history is the
        // source, and every number here is derived from its real rows.
        const json = await apiFetch<{ data: BidderBid[] }>(
          `users/${encodeURIComponent(userId)}/bids`
        );
        if (cancelled) return;
        const bids = json.data ?? [];

        // One entry per lot: several bids on the same lot are one auction.
        const lots = new Map<
          string,
          { winning: boolean; closed: boolean; endsAt: number | null }
        >();
        for (const bid of bids) {
          const lot = lots.get(bid.productId) ?? {
            winning: false,
            closed: false,
            endsAt: null,
          };
          lot.winning = lot.winning || Boolean(bid.isWinningBid);
          const status = bid.product?.status;
          if (status && CLOSED_LOT_STATUSES.has(status)) lot.closed = true;
          const endsAt = bid.product?.endTime
            ? new Date(bid.product.endTime).getTime()
            : null;
          if (endsAt !== null && !Number.isNaN(endsAt)) lot.endsAt = endsAt;
          lots.set(bid.productId, lot);
        }

        const now = Date.now();
        const active = Array.from(lots.values()).filter((lot) => !lot.closed);
        setCounts({
          activeBids: active.length,
          winning: active.filter((lot) => lot.winning).length,
          outbid: active.filter((lot) => !lot.winning).length,
          endingSoon: active.filter(
            (lot) =>
              lot.endsAt !== null &&
              lot.endsAt > now &&
              lot.endsAt - now <= ENDING_SOON_WINDOW_MS
          ).length,
        });
      } catch {
        // No bids we can prove — an empty state beats invented numbers.
        if (!cancelled) {
          setCounts({ activeBids: 0, winning: 0, outbid: 0, endingSoon: 0 });
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  // An unauthenticated visitor has provably no bids, so it is an empty state,
  // not a permanent skeleton.
  const resolved =
    counts ??
    (status === 'unauthenticated'
      ? { activeBids: 0, winning: 0, outbid: 0, endingSoon: 0 }
      : null);

  if (resolved === null) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border">
            <CardContent className="flex flex-col gap-2 p-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (resolved.activeBids === 0) {
    return (
      <EmptyState
        title={t('noStatsTitle')}
        description={t('noStatsDescription')}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border">
            <CardContent className="flex flex-col gap-2 p-3">
              <div className={`flex items-center gap-2`}>
                <div
                  className={`flex h-8 w-8 rounded-lg p-1 items-center justify-center ${stat.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">{t(stat.label)}</p>
              </div>
              <div>
                <p className="text-lg font-bold">{resolved[stat.key]}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

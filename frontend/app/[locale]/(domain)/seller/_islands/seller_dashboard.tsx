'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import {
  Button,
  DatePickerWithRange,
  Skeleton,
} from '@/shared/components/common';

import SellerStatsCards from '../dashboard/components/seller_stats_cards';
import SellerAnalytics from '../dashboard/components/seller_analytics';
import ListedAuctions from '../dashboard/components/listed_auctions/listed_auctions';
import Messages from '../dashboard/components/messages';
import { Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/shared/utils/api-client';

const TotalRevenue = dynamic(() => import('../dashboard/components/total_revenue'), {
  loading: () => <Skeleton className="h-[300px] rounded-lg" />,
  ssr: false,
});

interface DashboardPayload {
  data?: {
    stats?: {
      active_products?: number;
      total_orders?: number;
      total_products?: number;
    };
  };
}

export default function SellerDashboardIsland() {
  const t = useTranslations('seller.home');
  // The cards used to be hardcoded zeros. Each figure below comes from a
  // seller-scoped endpoint, so an account with no activity reads 0 for a reason.
  const [counts, setCounts] = useState({
    activeLots: 0,
    bidsReceived: 0,
    orders: 0,
    payoutsPending: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [dashboard, products, payouts] = await Promise.all([
        apiFetch<DashboardPayload>('sellers/dashboard').catch(() => null),
        apiFetch<{ data?: { items?: Array<{ totalBids?: number }> } }>(
          'sellers/me/products',
        ).catch(() => null),
        apiFetch<{ statistics?: { in_progress_count?: number } }>(
          'sellers/payouts/me?limit=1',
        ).catch(() => null),
      ]);
      if (cancelled) return;

      const stats = dashboard?.data?.stats ?? {};
      const items = products?.data?.items;

      setCounts({
        activeLots: Number(stats.active_products ?? 0),
        bidsReceived: Array.isArray(items)
          ? items.reduce((sum, item) => sum + (Number(item.totalBids) || 0), 0)
          : 0,
        orders: Number(stats.total_orders ?? 0),
        payoutsPending: Number(payouts?.statistics?.in_progress_count ?? 0),
      });
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('overview')}</h1>
        <div className="flex items-center gap-2">
          <DatePickerWithRange />
          <Button size="lg">
            <Upload />
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div>
        <SellerStatsCards
          activeLots={counts.activeLots}
          bidsReceived={counts.bidsReceived}
          orders={counts.orders}
          payoutsPending={counts.payoutsPending}
        />
      </div>

      {/* Analytics (L3) */}
      <SellerAnalytics />

      {/* Left column */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TotalRevenue />
        <Messages />
      </div>
      {/* Right column */}
      <div className="space-y-4">
        <ListedAuctions />
      </div>
    </div>
  );
}
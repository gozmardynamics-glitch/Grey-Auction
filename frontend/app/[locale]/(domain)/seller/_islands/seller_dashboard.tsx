'use client';

import dynamic from 'next/dynamic';

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

const TotalRevenue = dynamic(() => import('../dashboard/components/total_revenue'), {
  loading: () => <Skeleton className="h-[300px] rounded-lg" />,
  ssr: false,
});

export default function SellerDashboardIsland() {
  const t = useTranslations('seller.home');
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
          activeAuctions={0}
          bids={0}
          users={0}
          pendingRequests={0}
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

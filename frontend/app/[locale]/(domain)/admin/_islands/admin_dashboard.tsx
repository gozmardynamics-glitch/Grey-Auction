'use client';

import dynamic from 'next/dynamic';

import {
  Button,
  DatePickerWithRange,
  Skeleton,
} from '@/shared/components/common';

import { useTranslations } from 'next-intl';

import AdminStatsCards from '../dashboard/components/admin_stats_cards';
import PendingRequests from '../dashboard/components/pending_requests/pending requests';

const TotalRevenue = dynamic(() => import('../dashboard/components/total_revenue'), {
  loading: () => <Skeleton className="h-[300px] rounded-lg" />,
  ssr: false,
});
const RegisteredUsers = dynamic(() => import('../dashboard/components/registered_users'), {
  loading: () => <Skeleton className="h-[240px] rounded-lg" />,
  ssr: false,
});
const AuctionActivity = dynamic(() => import('../dashboard/components/auction_activity'), {
  loading: () => <Skeleton className="h-[240px] rounded-lg" />,
  ssr: false,
});

export default function AdminDashboardIsland() {
  const t = useTranslations('admin.home');
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('overview')}</h1>
        <div className="flex items-center gap-2">
          <DatePickerWithRange />
          <Button size="lg">
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div>
        <AdminStatsCards
          activeAuctions={0}
          bids={0}
          users={0}
          pendingRequests={0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          <TotalRevenue />
          <PendingRequests />
        </div>
        {/* Right column */}
        <div className="lg:col-span-1 space-y-4">
          <RegisteredUsers />
          <AuctionActivity />
        </div>
      </div>
    </div>
  );
}

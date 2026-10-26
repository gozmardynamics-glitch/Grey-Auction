import StatsCard from '@/shared/components/common/stats_card';
import { Gavel, HandCoins, ClipboardList, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DashboardStatsProps {
  activeLots: number;
  bidsReceived: number;
  orders: number;
  payoutsPending: number;
  activeLotsTrend?: number;
  bidsReceivedTrend?: number;
  ordersTrend?: number;
  payoutsPendingTrend?: number;
}

export default function DashboardStats({
  activeLots,
  bidsReceived,
  orders,
  payoutsPending,
  activeLotsTrend = 0,
  bidsReceivedTrend = 0,
  ordersTrend = 0,
  payoutsPendingTrend = 0,
}: DashboardStatsProps) {
  const t = useTranslations('seller.home.stats');
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatsCard
        title={t('activeLots')}
        value={activeLots}
        icon={Gavel}
        trend={activeLotsTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title={t('bidsReceived')}
        value={bidsReceived}
        icon={HandCoins}
        trend={bidsReceivedTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title={t('orders')}
        value={orders}
        icon={ClipboardList}
        trend={ordersTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title={t('payoutsPending')}
        value={payoutsPending}
        icon={Wallet}
        trend={payoutsPendingTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
    </div>
  );
}

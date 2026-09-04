import StatsCard from '@/shared/components/common/stats_card';
import { Gavel, HandCoins, Users, ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DashboardStatsProps {
  activeAuctions: number;
  bids: number;
  users: number;
  pendingRequests: number;
  auctionsTrend?: number;
  bidsTrend?: number;
  usersTrend?: number;
  requestsTrend?: number;
}

export default function DashboardStats({
  activeAuctions,
  bids,
  users,
  pendingRequests,
  auctionsTrend = 0,
  bidsTrend = 0,
  usersTrend = 0,
  requestsTrend = 0,
}: DashboardStatsProps) {
  const t = useTranslations('seller.home.stats');
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatsCard
        title={t('activeAuctions')}
        value={activeAuctions}
        icon={Gavel}
        trend={auctionsTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title={t('bids')}
        value={bids}
        icon={HandCoins}
        trend={bidsTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title={t('users')}
        value={users}
        icon={Users}
        trend={usersTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title={t('pendingRequests')}
        value={pendingRequests}
        icon={ClipboardList}
        trend={requestsTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
    </div>
  );
}

import StatsCard from '@/shared/components/common/stats_card';
import { Gavel, HandCoins, Users, ClipboardList } from 'lucide-react';

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
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatsCard
        title="Active Auctions"
        value={activeAuctions}
        icon={Gavel}
        trend={auctionsTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title="Bids"
        value={bids}
        icon={HandCoins}
        trend={bidsTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title="Users"
        value={users}
        icon={Users}
        trend={usersTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title="Pending Requests"
        value={pendingRequests}
        icon={ClipboardList}
        trend={requestsTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
    </div>
  );
}

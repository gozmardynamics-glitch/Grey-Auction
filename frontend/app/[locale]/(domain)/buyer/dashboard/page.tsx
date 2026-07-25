import BuyerDashboardModules from '../_islands/dashboard_modules';
import LatestAuctionsBanner from '@/app/[locale]/(website)/components/latest_auctions';

export default function BuyerSettingsPage() {
  return (
    <div className="space-y-6 mt-6">
      <h1 className="text-2xl font-bold tracking-tight">My Account</h1>
      <BuyerDashboardModules />
      <LatestAuctionsBanner />
    </div>
  );
}

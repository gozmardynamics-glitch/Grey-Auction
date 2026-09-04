import { useTranslations } from 'next-intl';

import BuyerStats from '../components/dashboard/stats';
import ActiveAuctions from '../components/dashboard/active_auctions';
import AuctionAlerts from '../components/dashboard/auction_alerts';
import RecentInvoices from '../components/dashboard/recent_invoices';

export default function BuyerDashboardModule() {
  const t = useTranslations('buyer.home');
  return (
    <div className="space-y-6 p-6">
      {/* Welcome */}
      <h2 className="text-lg font-semibold">
        {t('welcome', { name: 'Jayden' })} <span className="inline-block">&#x1F44B;</span>
      </h2>

      {/* Stats */}
      <BuyerStats />

      {/* Active Auctions & Auction Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActiveAuctions />
        </div>
        <div>
          <AuctionAlerts />
        </div>
      </div>

      {/* Recent Invoices */}
      <RecentInvoices />
    </div>
  );
}

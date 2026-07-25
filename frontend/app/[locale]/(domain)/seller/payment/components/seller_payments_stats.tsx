import StatsCard from '@/shared/components/common/stats_card';
import { CircleDollarSign, Clock } from 'lucide-react';
import { Payment } from '@/app/[locale]/(domain)/admin/models';

interface SellerPaymentStatsProps {
  payments: Payment[];
  earningsTrend?: number;
  pendingTrend?: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);

export default function SellerPaymentStats({
  payments,
  earningsTrend = 8,
  pendingTrend = -3,
}: SellerPaymentStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatsCard
        title="Total Earnings"
        value={formatCurrency(
          payments.reduce((sum, p) => sum + p.amount, 0)
        )}
        icon={CircleDollarSign}
        trend={earningsTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title="Pending Payments"
        value={payments.filter((p) => p.status === 'Pending').length}
        icon={Clock}
        trend={pendingTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
    </div>
  );
}

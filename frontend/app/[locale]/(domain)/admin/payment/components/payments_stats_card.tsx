'use client';

import StatsCard from '@/shared/components/common/stats_card';
import {
  CreditCard,
  CircleDollarSign,
  Clock,
  CircleCheck,
} from 'lucide-react';
import { Payment } from '../../models';

interface PaymentStatsProps {
  payments: Payment[];
  revenueTrend?: number;
  totalTrend?: number;
  pendingTrend?: number;
  completedTrend?: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(value);

export default function PaymentStats({
  payments,
  revenueTrend = 8,
  totalTrend = 12,
  pendingTrend = -3,
  completedTrend = 15,
}: PaymentStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Total Payments"
        value={payments.length}
        icon={CreditCard}
        trend={totalTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title="Total Revenue"
        value={formatCurrency(
          payments.reduce((sum, p) => sum + p.amount, 0)
        )}
        icon={CircleDollarSign}
        trend={revenueTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title="Pending"
        value={payments.filter((p) => p.status === 'Pending').length}
        icon={Clock}
        trend={pendingTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
      <StatsCard
        title="Completed"
        value={payments.filter((p) => p.status === 'Completed').length}
        icon={CircleCheck}
        trend={completedTrend}
        iconColor="text-foreground"
        iconBgColor="bg-background"
      />
    </div>
  );
}

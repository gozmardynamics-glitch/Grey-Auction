'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/shared/utils/api-client';

import {
  Button,
  DatePickerWithRange,
  Skeleton,
} from '@/shared/components/common';

import AdminStatsCards from '../dashboard/components/admin_stats_cards';
import PendingRequests from '../dashboard/components/pending_requests/pending requests';
import { useTranslations } from 'next-intl';

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

/**
 * GET /admin/kpi. Money fields are deliberately separate: GMV is volume, VAT is
 * a liability, and the escrow float is client money. Only `platformRevenue` is
 * income.
 */
interface AdminKpi {
  currency: string;
  gmv: number;
  platformRevenue: number;
  buyerPremium: number;
  sellerCommission: number;
  vatCollected: number;
  buyerBilled: number;
  receivable: number;
  invoicesPaid: number;
  invoicesUnpaid: number;
  invoicesTotal: number;
  escrowFloat: number;
  escrowSellerNetHeld: number;
  payoutsInProgress: number;
  payoutsPending: number;
  holdsOpen: number;
  holdsNotReconciling: number;
  activeAuctions: number;
  totalBids: number;
  totalBuyers: number;
  pendingSellers: number;
}

export default function AdminDashboardIsland() {
  const t = useTranslations('admin.home');
  const [kpi, setKpi] = useState<AdminKpi | null>(null);

  useEffect(() => {
    let cancelled = false;
    // The cards were hardcoded zeros. One aggregate endpoint gives exact totals
    // (COUNT in SQL) instead of counting the first page of a list.
    apiFetch<{ data?: AdminKpi }>('admin/kpi')
      .then((json) => {
        if (!cancelled) setKpi(json?.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setKpi(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const money = (value: number | undefined) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: kpi?.currency || 'NGN',
      maximumFractionDigits: 0,
    }).format(Number(value ?? 0));

  const moneyCards: Array<{ label: string; value: number | undefined; hint?: string }> = [
    { label: 'GMV (hammer value — not revenue)', value: kpi?.gmv },
    { label: 'Platform revenue (ex-VAT)', value: kpi?.platformRevenue },
    { label: 'VAT collected (liability)', value: kpi?.vatCollected },
    { label: 'Escrow float (client money)', value: kpi?.escrowFloat },
  ];

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
          activeAuctions={kpi?.activeAuctions ?? 0}
          bids={kpi?.totalBids ?? 0}
          users={kpi?.totalBuyers ?? 0}
          pendingRequests={kpi?.pendingSellers ?? 0}
        />

        {/* Money KPIs. Deliberately separate labels: GMV is volume, not income,
            and VAT is money held for the tax authority. */}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {moneyCards.map((item) => (
            <div key={item.label} className="rounded-lg border border-border/60 bg-card p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-lg font-semibold">{money(item.value)}</p>
              {item.hint && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{item.hint}</p>
              )}
            </div>
          ))}
        </div>

        {/* Client-money reconciliation: what is held, what is owed, and whether
            every open hold still splits into seller + platform + VAT. */}
        <div className="mt-3 rounded-lg border border-border/60 bg-card p-3">
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Holds open', value: String(kpi?.holdsOpen ?? 0) },
              { label: 'Seller net held', value: money(kpi?.escrowSellerNetHeld) },
              { label: 'Payouts in progress', value: money(kpi?.payoutsInProgress) },
              { label: 'Payouts pending', value: String(kpi?.payoutsPending ?? 0) },
              { label: 'Unpaid invoices', value: money(kpi?.receivable) },
              { label: 'Holds not reconciling', value: String(kpi?.holdsNotReconciling ?? 0) },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          {(kpi?.holdsNotReconciling ?? 0) > 0 && (
            <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
              One or more escrow holds do not split into seller + platform + VAT.
              Release would move money to the wrong party — review before paying out.
            </p>
          )}
        </div>
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

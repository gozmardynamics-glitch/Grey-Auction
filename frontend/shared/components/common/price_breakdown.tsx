'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/shared/utils/helpers';

interface FeeBreakdown {
  bidAmount: number;
  commission: number;
  vatOnBid: number;
  vatOnCommission: number;
  otherCharges: number;
  fixedFee: number;
  total: number;
  rates: {
    commissionPct: number;
    vatPct: number;
    otherChargesPct: number;
    fixedFee: number;
  };
}

interface PriceBreakdownProps {
  amount: number;
  category?: string;
  className?: string;
}

const DEFAULT_COMMISSION_PCT = 10;
const DEFAULT_VAT_PCT = 7.5;

const computeFallback = (amount: number): FeeBreakdown => {
  const commission = amount * (DEFAULT_COMMISSION_PCT / 100);
  const vatOnBid = amount * (DEFAULT_VAT_PCT / 100);
  const vatOnCommission = commission * (DEFAULT_VAT_PCT / 100);
  const otherCharges = 0;
  const fixedFee = 0;
  return {
    bidAmount: amount,
    commission,
    vatOnBid,
    vatOnCommission,
    otherCharges,
    fixedFee,
    total: amount + commission + vatOnBid + vatOnCommission + otherCharges + fixedFee,
    rates: {
      commissionPct: DEFAULT_COMMISSION_PCT,
      vatPct: DEFAULT_VAT_PCT,
      otherChargesPct: 0,
      fixedFee: 0,
    },
  };
};

function PriceBreakdown({ amount, category, className }: PriceBreakdownProps) {
  const [data, setData] = useState<FeeBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (amount <= 0) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const params = new URLSearchParams({ amount: String(amount) });
        if (category) params.set('category', category);
        const res = await fetch(`${apiBase}/fees/breakdown?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch fee breakdown');
        const json = await res.json();
        if (!json?.success || !json?.data) throw new Error('Invalid breakdown response');
        setData(json.data);
      } catch {
        setData(computeFallback(amount));
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [amount, category]);

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const rows: Array<{ label: string; value: number }> = [
    { label: 'Your bid', value: data.bidAmount },
    {
      label: `Platform commission (${data.rates.commissionPct}%)`,
      value: data.commission,
    },
    {
      label: `VAT on bid (${data.rates.vatPct}%)`,
      value: data.vatOnBid,
    },
    { label: 'VAT on commission', value: data.vatOnCommission },
    { label: 'Other charges', value: data.otherCharges },
    { label: 'Fixed fee', value: data.fixedFee },
  ].filter((row, index) => index === 0 || row.value !== 0);

  return (
    <div className={cn('space-y-3 text-sm', className)}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between">
          <span className="text-muted-foreground">{row.label}</span>
          <span className="text-foreground">{formatCurrency(row.value)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
        <span className="text-foreground">Total payable</span>
        <span className="text-foreground">{formatCurrency(data.total)}</span>
      </div>
    </div>
  );
}

export { PriceBreakdown };

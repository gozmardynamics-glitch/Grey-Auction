'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAppSelector } from '@/redux/store';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
} from '@/shared/components/common';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FeeOverride {
  scope: 'seller' | 'product';
  scopeId: string;
  buyerFeePct: number | null;
  buyerFeeEnabled: boolean | null;
  sellerFeePct: number | null;
  sellerFeeEnabled: boolean | null;
  vatPct: number | null;
  vatBase: 'fees_only' | 'hammer_and_fees' | null;
}

const PAYOUT_FREQUENCIES = ['instant', 'daily', 'weekly', 'monthly'] as const;

export default function FeesPayoutsSettings() {
  const token = useAppSelector((state) => state.auth.token);
  const authed = useCallback(
    (init: RequestInit = {}): RequestInit => ({
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    }),
    [token],
  );

  const [loading, setLoading] = useState(true);
  const [savingFees, setSavingFees] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);

  // U5 #1 — per-seller fee overrides
  const [buyerFeePct, setBuyerFeePct] = useState('');
  const [buyerFeeEnabled, setBuyerFeeEnabled] = useState(true);
  const [sellerFeePct, setSellerFeePct] = useState('');
  const [sellerFeeEnabled, setSellerFeeEnabled] = useState(true);
  const [vatPct, setVatPct] = useState('');
  const [vatBase, setVatBase] = useState<'fees_only' | 'hammer_and_fees'>(
    'hammer_and_fees',
  );

  // U5 #3 — payout schedule
  const [frequency, setFrequency] = useState<string>('weekly');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [overrideRes, meRes] = await Promise.all([
          fetch(`${API_BASE}/sellers/settings/fees`, { cache: 'no-store' }),
          fetch(`${API_BASE}/sellers/profile/me`, { cache: 'no-store' }),
        ]);
        const overrideJson = await overrideRes.json();
        const meJson = await meRes.json();
        if (cancelled) return;
        const mine: FeeOverride | undefined = overrideJson?.data ?? undefined;
        if (mine) {
          setBuyerFeePct(mine.buyerFeePct != null ? String(mine.buyerFeePct) : '');
          setBuyerFeeEnabled(mine.buyerFeeEnabled ?? true);
          setSellerFeePct(mine.sellerFeePct != null ? String(mine.sellerFeePct) : '');
          setSellerFeeEnabled(mine.sellerFeeEnabled ?? true);
          setVatPct(mine.vatPct != null ? String(mine.vatPct) : '');
          setVatBase(mine.vatBase ?? 'hammer_and_fees');
        }
        const seller = meJson?.data;
        if (seller?.payout_frequency) setFrequency(seller.payout_frequency);
      } catch {
        if (!cancelled) toast.error('Failed to load fee settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveFees = async () => {
    setSavingFees(true);
    try {
      const res = await fetch(`${API_BASE}/sellers/settings/fees`, authed({
        method: 'PUT',
        body: JSON.stringify({
          buyerFeePct: buyerFeePct === '' ? null : Number(buyerFeePct),
          buyerFeeEnabled,
          sellerFeePct: sellerFeePct === '' ? null : Number(sellerFeePct),
          sellerFeeEnabled,
          vatPct: vatPct === '' ? null : Number(vatPct),
          vatBase,
        }),
      }));
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error('save failed');
      toast.success('Fee preferences saved.');
    } catch {
      toast.error('Failed to save fee preferences.');
    } finally {
      setSavingFees(false);
    }
  };

  const savePayout = async () => {
    setSavingPayout(true);
    try {
      const res = await fetch(
        `${API_BASE}/sellers/settings/payout-frequency`,
        authed({ method: 'PATCH', body: JSON.stringify({ frequency }) }),
      );
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error('save failed');
      toast.success('Payout schedule saved.');
    } catch {
      toast.error('Failed to save payout schedule.');
    } finally {
      setSavingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Fees &amp; Payouts (U5)</h3>
        <p className="text-sm text-muted-foreground">
          Your fee preferences apply to your listings unless a specific product
          overrides them. Leave a field empty to inherit the platform default.
        </p>
      </div>

      {/* ─── U5 #1: per-seller fee overrides ─────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your fee rates</CardTitle>
          <CardDescription>
            Buyer fee and seller commission, each adjustable and toggleable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Buyer fee (%)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={buyerFeePct}
                  onChange={(e) => setBuyerFeePct(e.target.value)}
                  placeholder="inherit"
                  className="max-w-[140px]"
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={buyerFeeEnabled}
                    onCheckedChange={setBuyerFeeEnabled}
                  />
                  <span className="text-sm text-muted-foreground">
                    {buyerFeeEnabled ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Seller commission (%)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={sellerFeePct}
                  onChange={(e) => setSellerFeePct(e.target.value)}
                  placeholder="inherit"
                  className="max-w-[140px]"
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={sellerFeeEnabled}
                    onCheckedChange={setSellerFeeEnabled}
                  />
                  <span className="text-sm text-muted-foreground">
                    {sellerFeeEnabled ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">VAT rate (%)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={vatPct}
                onChange={(e) => setVatPct(e.target.value)}
                placeholder="inherit"
                className="max-w-[140px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">VAT base</Label>
              <Select value={vatBase} onValueChange={(v) => setVatBase(v as 'fees_only' | 'hammer_and_fees')}>
                <SelectTrigger className="max-w-[260px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fees_only">Fees only</SelectItem>
                  <SelectItem value="hammer_and_fees">Hammer + fees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={saveFees} disabled={savingFees}>
            {savingFees ? 'Saving…' : 'Save fee preferences'}
          </Button>
        </CardContent>
      </Card>

      {/* ─── U5 #3: payout schedule ──────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payout schedule</CardTitle>
          <CardDescription>
            How often your settled funds are paid out. No fixed holding period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="max-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYOUT_FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    <span className="capitalize">{f}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="capitalize">
              current: {frequency}
            </Badge>
          </div>
          <Button onClick={savePayout} disabled={savingPayout}>
            {savingPayout ? 'Saving…' : 'Save payout schedule'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('seller.settings.feesPayouts');
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
        if (!cancelled) toast.error(t('loadFailed'));
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
      toast.success(t('feesSaved'));
    } catch {
      toast.error(t('feesSaveFailed'));
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
      toast.success(t('payoutSaved'));
    } catch {
      toast.error(t('payoutSaveFailed'));
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
        <h3 className="text-base font-semibold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* ─── U5 #1: per-seller fee overrides ─────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('feeRatesTitle')}</CardTitle>
          <CardDescription>
            {t('feeRatesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">{t('buyerFee')}</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={buyerFeePct}
                  onChange={(e) => setBuyerFeePct(e.target.value)}
                  placeholder={t('inherit')}
                  className="max-w-[140px]"
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={buyerFeeEnabled}
                    onCheckedChange={setBuyerFeeEnabled}
                  />
                  <span className="text-sm text-muted-foreground">
                    {buyerFeeEnabled ? t('on') : t('off')}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('sellerCommission')}</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={sellerFeePct}
                  onChange={(e) => setSellerFeePct(e.target.value)}
                  placeholder={t('inherit')}
                  className="max-w-[140px]"
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={sellerFeeEnabled}
                    onCheckedChange={setSellerFeeEnabled}
                  />
                  <span className="text-sm text-muted-foreground">
                    {sellerFeeEnabled ? t('on') : t('off')}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('vatRate')}</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={vatPct}
                onChange={(e) => setVatPct(e.target.value)}
                placeholder={t('inherit')}
                className="max-w-[140px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('vatBase')}</Label>
              <Select value={vatBase} onValueChange={(v) => setVatBase(v as 'fees_only' | 'hammer_and_fees')}>
                <SelectTrigger className="max-w-[260px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fees_only">{t('vatBaseFeesOnly')}</SelectItem>
                  <SelectItem value="hammer_and_fees">{t('vatBaseHammerAndFees')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={saveFees} disabled={savingFees}>
            {savingFees ? t('saving') : t('saveFeePreferences')}
          </Button>
        </CardContent>
      </Card>

      {/* ─── U5 #3: payout schedule ──────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('payoutTitle')}</CardTitle>
          <CardDescription>
            {t('payoutDesc')}
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
            <Badge variant="outline">
              {t('currentFrequency', { frequency })}
            </Badge>
          </div>
          <Button onClick={savePayout} disabled={savingPayout}>
            {savingPayout ? t('saving') : t('savePayoutSchedule')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

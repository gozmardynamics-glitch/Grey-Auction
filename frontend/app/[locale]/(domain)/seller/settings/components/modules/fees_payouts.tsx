'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
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
import { apiFetch, ApiError } from '@/shared/utils/api-client';

interface FeeOverride {
  scope: 'seller' | 'product';
  scopeId: string;
  buyerFeePct: number | string | null;
  buyerFeeEnabled: boolean | null;
  sellerFeePct: number | string | null;
  sellerFeeEnabled: boolean | null;
  vatPct: number | string | null;
  vatBase: 'fees_only' | 'hammer_and_fees' | null;
}

const PAYOUT_FREQUENCIES = ['instant', 'daily', 'weekly', 'monthly'] as const;

export default function FeesPayoutsSettings() {
  const t = useTranslations('seller.settings.feesPayouts');

  const [loading, setLoading] = useState(true);
  const [savingFees, setSavingFees] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);

  // Percentages and VAT are platform revenue / statutory: the admin fixes them,
  // so they are displayed read-only. Only the two toggles are seller-editable
  // (SellerFeeSelfServiceDto rejects anything else with a 400).
  const [buyerFeePct, setBuyerFeePct] = useState('');
  const [buyerFeeEnabled, setBuyerFeeEnabled] = useState(true);
  const [sellerFeePct, setSellerFeePct] = useState('');
  const [sellerFeeEnabled, setSellerFeeEnabled] = useState(true);
  const [vatPct, setVatPct] = useState('');
  const [vatBase, setVatBase] = useState<'fees_only' | 'hammer_and_fees' | ''>('');

  // U5 #3 — payout schedule
  const [frequency, setFrequency] = useState<string>('weekly');

  // A string dependency keeps the one-shot load stable (t itself is recreated
  // on every render by mocked translators).
  const loadFailedMessage = t('loadFailed');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [overrideJson, meJson] = await Promise.all([
          apiFetch<{ data?: FeeOverride | null }>('sellers/settings/fees'),
          apiFetch<{ data?: { payout_frequency?: string | null } }>('sellers/profile/me'),
        ]);
        if (cancelled) return;
        const mine = overrideJson?.data;
        if (mine) {
          setBuyerFeePct(mine.buyerFeePct != null ? String(mine.buyerFeePct) : '');
          setBuyerFeeEnabled(mine.buyerFeeEnabled ?? true);
          setSellerFeePct(mine.sellerFeePct != null ? String(mine.sellerFeePct) : '');
          setSellerFeeEnabled(mine.sellerFeeEnabled ?? true);
          setVatPct(mine.vatPct != null ? String(mine.vatPct) : '');
          setVatBase(mine.vatBase ?? '');
        }
        const storedFrequency = meJson?.data?.payout_frequency;
        if (storedFrequency) setFrequency(storedFrequency);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiError ? err.message : loadFailedMessage);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFailedMessage]);

  const saveFees = async () => {
    setSavingFees(true);
    try {
      await apiFetch('sellers/settings/fees', {
        method: 'PUT',
        body: { buyerFeeEnabled, sellerFeeEnabled },
      });
      toast.success(t('feesSaved'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('feesSaveFailed'));
    } finally {
      setSavingFees(false);
    }
  };

  const savePayout = async () => {
    setSavingPayout(true);
    try {
      await apiFetch('sellers/settings/payout-frequency', {
        method: 'PATCH',
        body: { frequency },
      });
      toast.success(t('payoutSaved'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('payoutSaveFailed'));
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
          Your fee preferences apply to your listings unless a specific product
          overrides them.
        </p>
      </div>

      {/* ─── U5 #1: per-seller fee toggles ────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('feeRatesTitle')}</CardTitle>
          <CardDescription>
            Buyer fee and seller commission rates are set by the platform admin.
            You can choose whether each one applies to your lots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">{t('buyerFee')}</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={buyerFeePct}
                  placeholder="—"
                  readOnly
                  className="max-w-[140px] bg-muted"
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
                  value={sellerFeePct}
                  placeholder="—"
                  readOnly
                  className="max-w-[140px] bg-muted"
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
                value={vatPct}
                placeholder="—"
                readOnly
                className="max-w-[140px] bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('vatBase')}</Label>
              <p className="flex h-9 items-center text-sm">
                {vatBase === 'fees_only'
                  ? t('vatBaseFeesOnly')
                  : vatBase === 'hammer_and_fees'
                    ? t('vatBaseHammerAndFees')
                    : '—'}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Percentages and VAT are set by the platform admin and cannot be edited
            here.
          </p>
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

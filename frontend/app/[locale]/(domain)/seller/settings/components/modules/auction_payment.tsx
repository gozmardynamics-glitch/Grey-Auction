'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/common';
import { useTranslations } from 'next-intl';
import { apiFetch, ApiError } from '@/shared/utils/api-client';

interface SellerPaymentProfile {
  invoice_payment_due_days?: number | null;
  require_minimum_bid_deposit?: boolean | null;
  minimum_bid_deposit?: number | string | null;
}

export default function AuctionPaymentSettings() {
  const t = useTranslations('seller.settings.auctionPayment');

  const [days, setDays] = useState(7);
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [minDeposit, setMinDeposit] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await apiFetch<{ data?: SellerPaymentProfile }>('sellers/profile/me');
        const profile = json?.data;
        if (cancelled || !profile) return;
        setDays(profile.invoice_payment_due_days ?? 7);
        setRequireDeposit(Boolean(profile.require_minimum_bid_deposit));
        setMinDeposit(
          profile.minimum_bid_deposit != null ? String(profile.minimum_bid_deposit) : '',
        );
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiError ? err.message : 'Could not load the settings');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch('sellers/profile/me', {
        method: 'PATCH',
        body: {
          invoice_payment_due_days: Number(days) || 7,
          require_minimum_bid_deposit: requireDeposit,
          minimum_bid_deposit:
            requireDeposit && minDeposit !== '' && Number.isFinite(Number(minDeposit))
              ? Number(minDeposit)
              : null,
        },
      });
      toast.success(t('saved'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-base font-semibold mb-1">{t('title')}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {t('description')}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('timelineTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="text-sm font-medium" htmlFor="due-days">
              {t('dueDaysLabel')}
            </label>
            <input
              id="due-days"
              type="number"
              min={0}
              value={days}
              disabled={loading}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">{t('requireDeposit')}</p>
              <p className="text-xs text-muted-foreground">
                {t('requireDepositDesc')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={requireDeposit}
              onChange={(e) => setRequireDeposit(e.target.checked)}
              className="h-4 w-4"
            />
          </div>

          {requireDeposit && (
            <div>
              <label className="text-sm font-medium" htmlFor="min-deposit">
                {t('minDepositLabel')}
              </label>
              <input
                id="min-deposit"
                type="number"
                min={0}
                value={minDeposit}
                placeholder={t('minDepositPlaceholder')}
                onChange={(e) => setMinDeposit(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          )}

          <Button onClick={save} disabled={loading || saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? t('saving') : t('saveSettings')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

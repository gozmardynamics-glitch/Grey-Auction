'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/common';
import { useAppSelector } from '@/redux/store';
import { useTranslations } from 'next-intl';

interface AuctionPaymentSettings {
  invoice_payment_due_days: number;
  require_minimum_bid_deposit: boolean;
  minimum_bid_deposit: number | null;
}

export default function AuctionPaymentSettings() {
  const t = useTranslations('seller.settings.auctionPayment');
  const token = useAppSelector((state) => state.auth.token);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const [days, setDays] = useState(7);
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [minDeposit, setMinDeposit] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(apiBase + '/seller/profile/me', {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (res.ok) {
          const json = await res.json();
          const p = json?.data ?? json;
          setDays(p?.invoice_payment_due_days ?? 7);
          setRequireDeposit(Boolean(p?.require_minimum_bid_deposit));
          setMinDeposit(p?.minimum_bid_deposit != null ? String(p.minimum_bid_deposit) : '');
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, apiBase]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(apiBase + '/seller/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          invoice_payment_due_days: Number(days) || 7,
          require_minimum_bid_deposit: requireDeposit,
          minimum_bid_deposit: requireDeposit && minDeposit ? Number(minDeposit) : null,
        }),
      });
      if (res.ok) {
        setMessage(t('saved'));
      } else {
        setMessage(t('saveFailed'));
      }
    } catch {
      setMessage(t('saveFailed'));
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

          {message && <p className="text-xs text-muted-foreground">{message}</p>}

          <Button onClick={save} disabled={loading || saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? t('saving') : t('saveSettings')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

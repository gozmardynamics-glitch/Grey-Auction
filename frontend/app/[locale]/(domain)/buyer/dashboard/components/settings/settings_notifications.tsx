'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button, Switch } from '@/shared/components/common';
import { defaultPreferences } from '../../../models/data';

// Model-as-keys (Pattern 1): preference labels resolve per locale via the catalog.
const PREF_LABEL_KEYS: Record<string, string> = {
  auction_alerts: 'prefs.auctionAlerts',
  bid_status: 'prefs.bidStatus',
  payment_invoice: 'prefs.paymentInvoice',
  watchlist: 'prefs.watchlist',
  system: 'prefs.system',
};

export default function SettingsNotifications() {
  const t = useTranslations('buyer.settings.notifications');
  const [preferences, setPreferences] = useState(defaultPreferences);

  const toggle = (index: number) => {
    setPreferences((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const onSave = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/settings/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });
      toast.success(t('saved'));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      toast.error(t('saveFailed'));
    }
  };

  return (
    <div className="space-y-5 w-full sm:w-[50%]">
      <div className="space-y-4">
        {preferences.map((pref, i) => (
          <div
            key={pref.key}
            className="flex items-center justify-between py-1"
          >
            <span className="text-sm">
              {t(PREF_LABEL_KEYS[pref.key] ?? pref.key)}
            </span>
            <Switch
              checked={pref.enabled}
              onCheckedChange={() => toggle(i)}
            />
          </div>
        ))}
      </div>

      <Button onClick={onSave}>{t('saveChanges')}</Button>
    </div>
  );
}

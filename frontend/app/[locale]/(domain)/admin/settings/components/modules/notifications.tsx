'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button, Label, Switch } from '@/shared/components/common';

interface NotificationItem {
  key: string;
  labelKey: string;
  descriptionKey: string;
  enabled: boolean;
}

const defaultNotifications: NotificationItem[] = [
  {
    key: 'auction',
    labelKey: 'auction',
    descriptionKey: 'auctionHint',
    enabled: true,
  },
  {
    key: 'paymentSuccessful',
    labelKey: 'paymentSuccessful',
    descriptionKey: 'paymentSuccessfulHint',
    enabled: true,
  },
  {
    key: 'withdrawalInitiated',
    labelKey: 'withdrawalInitiated',
    descriptionKey: 'withdrawalInitiatedHint',
    enabled: true,
  },
  {
    key: 'withdrawalCompleted',
    labelKey: 'withdrawalCompleted',
    descriptionKey: 'withdrawalCompletedHint',
    enabled: true,
  },
];

export default function NotificationsSettings() {
  const t = useTranslations('admin.settings.notifications');
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(defaultNotifications);

  const toggle = (key: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const onSave = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/settings/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications }),
      });
      toast.success(t('saved'));
    } catch (error) {
      console.error('Failed to save notifications:', error);
      toast.error(t('saveFailed'));
    }
  };

  return (
    <div className="space-y-6 p-6">
      {notifications.map((item) => (
        <div
          key={item.key}
          className="flex items-center justify-between"
        >
          <div>
            <Label className="text-sm font-medium">{t(item.labelKey)}</Label>
            <p className="text-xs text-muted-foreground">
              {t(item.descriptionKey)}
            </p>
          </div>
          <Switch
            checked={item.enabled}
            onCheckedChange={() => toggle(item.key)}
          />
        </div>
      ))}
      <div className="pt-2">
        <Button onClick={onSave}>{t('saveChanges')}</Button>
      </div>
    </div>
  );
}

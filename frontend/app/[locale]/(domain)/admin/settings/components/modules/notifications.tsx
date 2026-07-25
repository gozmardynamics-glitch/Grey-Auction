'use client';

import { useState } from 'react';
import { Label, Switch } from '@/shared/components/common';

interface NotificationItem {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const defaultNotifications: NotificationItem[] = [
  {
    key: 'auction',
    label: 'Auction',
    description: 'Get updates about listings and bidding activity.',
    enabled: true,
  },
  {
    key: 'paymentSuccessful',
    label: 'Payment successful',
    description: 'Stay informed about payments.',
    enabled: true,
  },
  {
    key: 'withdrawalInitiated',
    label: 'Withdrawal initiated',
    description: 'Get notified when sellers initiates withdrawal.',
    enabled: true,
  },
  {
    key: 'withdrawalCompleted',
    label: 'Withdrawal completed',
    description: 'Get notified when withdrawal is successful.',
    enabled: true,
  },
];

export default function NotificationsSettings() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(defaultNotifications);

  const toggle = (key: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n))
    );
  };

  return (
    <div className="space-y-6 p-6">
      {notifications.map((item) => (
        <div
          key={item.key}
          className="flex items-center justify-between"
        >
          <div>
            <Label className="text-sm font-medium">{item.label}</Label>
            <p className="text-xs text-muted-foreground">
              {item.description}
            </p>
          </div>
          <Switch
            checked={item.enabled}
            onCheckedChange={() => toggle(item.key)}
          />
        </div>
      ))}
    </div>
  );
}
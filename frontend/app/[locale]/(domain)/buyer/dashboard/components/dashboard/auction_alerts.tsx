'use client';

import { AlertCircle, Bell, Clock, Trophy, Radio } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, Card, EmptyState } from '@/shared/components/common';

import { AuctionAlert } from '../../../models';
import { alerts } from '../../../models/data';

const alertIcons: Record<
  AuctionAlert['type'],
  { icon: typeof AlertCircle; color: string }
> = {
  outbid: { icon: AlertCircle, color: 'text-red-500' },
  ending: { icon: Clock, color: 'text-yellow-500' },
  won: { icon: Trophy, color: 'text-tertiary' },
};

export default function AuctionAlerts() {
  const t = useTranslations('buyer.home');
  return (
    <Card className="space-y-3 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('auctionAlerts')}</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Radio className="h-3.5 w-3.5 text-tertiary" />
        </Button>
      </div>
      {alerts.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title={t('noAlertsTitle')}
          description={t('noAlertsDescription')}
          className="py-8"
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const { icon: Icon, color } = alertIcons[alert.type];
            return (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {alert.auction}
                  </p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

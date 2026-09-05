'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Button,
  Card,
  CardContent,
  Label,
  Separator,
  Switch,
} from '@/shared/components/common';

export default function SystemStatusSettings() {
  const t = useTranslations('admin.settings.systemStatus');
  const [performance, setPerformance] = useState({
    cache: true,
    cdn: true,
    apiRateLimit: false,
    debugMode: false,
  });

  const infoItems = [
    {
      labelKey: 'systemVersion',
      descriptionKey: 'systemVersionHint',
      value: 'v1.0',
    },
    {
      labelKey: 'databaseVersion',
      descriptionKey: 'databaseVersionHint',
      value: 'PostgreSQL 14.2',
    },
    {
      labelKey: 'lastBackup',
      descriptionKey: 'lastBackupHint',
      value: '10-01-2026 • 11:23 AM',
    },
    {
      labelKey: 'systemUptime',
      descriptionKey: 'systemUptimeHint',
      value: '15 days, 7 hours',
    },
  ];

  const healthCards = [
    {
      labelKey: 'sslCertificate',
      descriptionKey: 'sslCertificateHint',
    },
    {
      labelKey: 'firewall',
      descriptionKey: 'firewallHint',
    },
    {
      labelKey: 'databaseSecurity',
      descriptionKey: 'databaseSecurityHint',
    },
  ];

  const managementActions = [
    'optimizeDatabase',
    'clearCache',
    'checkUpdates',
    'exportData',
  ];

  return (
    <div className="space-y-8 p-6">
      {/* ─── Info ──────────────────────────────────────────────── */}
      <section className="space-y-6">
        <h3 className="text-base font-semibold">{t('info')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
          {infoItems.map((item) => (
            <>
              <div key={item.labelKey}>
                <Label className="text-sm font-medium">{t(item.labelKey)}</Label>
                <p className="text-xs text-muted-foreground">
                  {t(item.descriptionKey)}
                </p>
              </div>
              <span key={`value-${item.labelKey}`} className="text-sm">
                {item.value}
              </span>
            </>
          ))}
        </div>
      </section>

      {/* ─── Health ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">{t('health')}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthCards.map((card) => (
            <Card key={card.labelKey}>
              <CardContent className="flex items-start gap-3 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-tertiary" />
                <div>
                  <p className="text-sm font-medium">{t(card.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(card.descriptionKey)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ─── Performance ───────────────────────────────────────── */}
      <section className="space-y-6">
        <h3 className="text-base font-semibold">{t('performance')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
          <div>
            <Label className="text-sm font-medium">{t('cache')}</Label>
            <p className="text-xs text-muted-foreground">
              {t('cacheHint')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={performance.cache}
              onCheckedChange={(c) =>
                setPerformance((s) => ({ ...s, cache: c }))
              }
            />
            <span className="text-sm text-muted-foreground">{t('enable')}</span>
          </div>

          <div>
            <Label className="text-sm font-medium">{t('cdn')}</Label>
            <p className="text-xs text-muted-foreground">
              {t('cdnHint')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={performance.cdn}
              onCheckedChange={(c) => setPerformance((s) => ({ ...s, cdn: c }))}
            />
            <span className="text-sm text-muted-foreground">{t('enable')}</span>
          </div>

          <div>
            <Label className="text-sm font-medium">{t('apiRateLimit')}</Label>
            <p className="text-xs text-muted-foreground">
              {t('apiRateLimitHint')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={performance.apiRateLimit}
              onCheckedChange={(c) =>
                setPerformance((s) => ({ ...s, apiRateLimit: c }))
              }
            />
            <span className="text-sm text-muted-foreground">{t('enable')}</span>
          </div>

          <div>
            <Label className="text-sm font-medium">{t('debugMode')}</Label>
            <p className="text-xs text-muted-foreground">
              {t('debugModeHint')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={performance.debugMode}
              onCheckedChange={(c) =>
                setPerformance((s) => ({ ...s, debugMode: c }))
              }
            />
            <span className="text-sm text-muted-foreground">{t('enable')}</span>
          </div>
        </div>
      </section>

      <Separator />

      {/* ─── Management ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">{t('management')}</h3>
        <div className="flex flex-wrap gap-3">
          {managementActions.map((action) => (
            <Button
              key={action}
              variant="outline"
              onClick={undefined}
            >
              {t(action)}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}

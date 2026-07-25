'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Label,
  Separator,
  Switch,
} from '@/shared/components/common';

export default function SystemStatusSettings() {
  const [performance, setPerformance] = useState({
    cache: true,
    cdn: true,
    apiRateLimit: false,
    debugMode: false,
  });

  const infoItems = [
    {
      label: 'System Version',
      description: 'Current system version.',
      value: 'v1.0',
    },
    {
      label: 'Database Version',
      description: 'Current database version.',
      value: 'PostgreSQL 14.2',
    },
    {
      label: 'Last Backup',
      description: 'System last backup.',
      value: '10-01-2026 • 11:23 AM',
    },
    {
      label: 'System Uptime',
      description: 'The system running time.',
      value: '15 days, 7 hours',
    },
  ];

  const healthCards = [
    {
      label: 'SSL Certificate',
      description: 'Valid until Dec 15, 2026',
    },
    {
      label: 'Firewall',
      description: 'Active and configured',
    },
    {
      label: 'Database Security',
      description: 'Encrypted and backed up',
    },
  ];

  const managementActions = [
    'Optimize Database',
    'Clear Cache',
    'Check Updates',
    'Export Data',
  ];

  return (
    <div className="space-y-8 p-6">
      {/* ─── Info ──────────────────────────────────────────────── */}
      <section className="space-y-6">
        <h3 className="text-base font-semibold">Info</h3>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
          {infoItems.map((item) => (
            <>
              <div key={`label-${item.label}`}>
                <Label className="text-sm font-medium">{item.label}</Label>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <span key={`value-${item.label}`} className="text-sm">
                {item.value}
              </span>
            </>
          ))}
        </div>
      </section>

      {/* ─── Health ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">Health</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="flex items-start gap-3 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-tertiary" />
                <div>
                  <p className="text-sm font-medium">{card.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
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
        <h3 className="text-base font-semibold">Health</h3>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-x-8 gap-y-3 md:gap-y-5">
          <div>
            <Label className="text-sm font-medium">Cache</Label>
            <p className="text-xs text-muted-foreground">
              Enable application caching.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={performance.cache}
              onCheckedChange={(c) =>
                setPerformance((s) => ({ ...s, cache: c }))
              }
            />
            <span className="text-sm text-muted-foreground">Enable</span>
          </div>

          <div>
            <Label className="text-sm font-medium">CDN</Label>
            <p className="text-xs text-muted-foreground">
              Use CDN for static assets.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={performance.cdn}
              onCheckedChange={(c) => setPerformance((s) => ({ ...s, cdn: c }))}
            />
            <span className="text-sm text-muted-foreground">Enable</span>
          </div>

          <div>
            <Label className="text-sm font-medium">API Rate Limit</Label>
            <p className="text-xs text-muted-foreground">
              Limit API requests per user.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={performance.apiRateLimit}
              onCheckedChange={(c) =>
                setPerformance((s) => ({ ...s, apiRateLimit: c }))
              }
            />
            <span className="text-sm text-muted-foreground">Enable</span>
          </div>

          <div>
            <Label className="text-sm font-medium">Debug Mode</Label>
            <p className="text-xs text-muted-foreground">
              Show detailed error messages.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={performance.debugMode}
              onCheckedChange={(c) =>
                setPerformance((s) => ({ ...s, debugMode: c }))
              }
            />
            <span className="text-sm text-muted-foreground">Enable</span>
          </div>
        </div>
      </section>

      <Separator />

      {/* ─── Management ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">Management</h3>
        <div className="flex flex-wrap gap-3">
          {managementActions.map((action) => (
            <Button
              key={action}
              variant="outline"
              onClick={() => console.log(action)}
            >
              {action}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}

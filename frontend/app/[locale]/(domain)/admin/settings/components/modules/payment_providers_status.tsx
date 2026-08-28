'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/common';

const ENV_HINTS: Record<string, string> = {
  paystack: 'PAYSTACK_SECRET_KEY',
  flutterwave: 'FLUTTERWAVE_SECRET_KEY (+ FLUTTERWAVE_WEBHOOK_HASH)',
  interswitch: 'INTERSWITCH_CLIENT_ID / INTERSWITCH_CLIENT_SECRET',
  opay: 'OPAY_MERCHANT_ID / OPAY_SECRET_KEY',
};

/** Live provider status from GET /payments/providers, with env placeholders. */
export function PaymentProvidersStatus() {
  const [providers, setProviders] = useState<{ provider: string; configured: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(apiBase + '/payments/providers')
      .then((r) => r.json())
      .then((j) => {
        const data = j?.data ?? [];
        if (Array.isArray(data)) setProviders(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment Providers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading provider status…</p>}
        {!loading && providers.length === 0 && (
          <p className="text-sm text-muted-foreground">No provider status available.</p>
        )}
        {providers.map((p) => (
          <div key={p.provider} className="flex flex-col gap-1 rounded-md border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">{p.provider}</span>
              <Badge variant="secondary" className={p.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'}>
                {p.configured ? 'Configured' : 'Not configured'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Set in env: <code className="font-mono text-[11px]">{ENV_HINTS[p.provider] ?? '—'}</code>
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default PaymentProvidersStatus;

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/common';
import { apiFetch } from '@/shared/utils/api-client';
import { useAppSelector } from '@/redux/store';

const ENV_HINTS: Record<string, string> = {
  paystack: 'PAYSTACK_SECRET_KEY',
  flutterwave: 'FLUTTERWAVE_SECRET_KEY (+ FLUTTERWAVE_WEBHOOK_HASH)',
  interswitch: 'INTERSWITCH_CLIENT_ID / INTERSWITCH_CLIENT_SECRET',
  opay: 'OPAY_MERCHANT_ID / OPAY_SECRET_KEY',
};

/** Live provider status from GET /payments/providers (JWT-guarded), with env placeholders. */
export function PaymentProvidersStatus() {
  const t = useTranslations('admin.settings.paymentProviders');
  const authToken = useAppSelector((state) => state.auth.token);
  const [providers, setProviders] = useState<
    { provider: string; configured: boolean; available?: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ data: { provider: string; configured: boolean; available?: boolean }[] }>(
      'payments/providers',
      {
        token: authToken,
      },
    )
      .then((j) => {
        const data = j?.data ?? [];
        if (!cancelled && Array.isArray(data)) setProviders(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">{t('loading')}</p>}
        {!loading && providers.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        )}
        {providers.map((p) => (
          <div key={p.provider} className="flex flex-col gap-1 rounded-md border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">{p.provider}</span>
              <div className="flex items-center gap-2">
                {/* Configured is not the same as offered: an operator can switch
                    a provider off at checkout with PAYMENT_PROVIDERS_DISABLED. */}
                {p.configured && p.available === false && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                    Switched off at checkout
                  </Badge>
                )}
                <Badge variant="secondary" className={p.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'}>
                  {p.configured ? t('configured') : t('notConfigured')}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('setInEnv')}{' '}
              <code className="font-mono text-[11px]">{ENV_HINTS[p.provider] ?? '—'}</code>
            </p>
            {p.configured && p.available === false && (
              <p className="text-xs text-muted-foreground">
                Listed in <code className="font-mono text-[11px]">PAYMENT_PROVIDERS_DISABLED</code> — buyers
                cannot choose it. Remove it there once its webhook signature is verified.
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default PaymentProvidersStatus;

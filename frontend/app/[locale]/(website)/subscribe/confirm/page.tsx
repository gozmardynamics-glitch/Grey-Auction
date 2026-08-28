'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function SubscribeConfirmPage() {
  const params = useSearchParams();
  const token = params.get('token');
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    fetch(apiBase + '/subscriptions/confirm?token=' + encodeURIComponent(token))
      .then((r) => r.json())
      .then((j) => setStatus(j?.success ? 'ok' : 'error'))
      .catch(() => setStatus('error'));
  }, [token, apiBase]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Confirming your subscription…</p>
        </div>
      )}
      {status === 'ok' && (
        <div className="space-y-3">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="text-xl font-semibold">You are subscribed!</h1>
          <p className="text-sm text-muted-foreground">Thanks for subscribing to GreyAuction updates.</p>
        </div>
      )}
      {status === 'error' && (
        <div className="space-y-3">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-xl font-semibold">Link invalid or expired</h1>
          <p className="text-sm text-muted-foreground">
            This confirmation link is not valid. Please try subscribing again.
          </p>
        </div>
      )}
    </div>
  );
}

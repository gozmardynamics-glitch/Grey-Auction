'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, MiniSpinner } from '@/shared/components/common';
import { useTranslations } from 'next-intl';

import { apiFetch, ApiError } from '@/shared/utils/api-client';

interface ReviewStepProps {
  amount: number;
  pin: string;
  /** Idempotency key generated once per flow, so a retry cannot debit twice. */
  reference: string;
  onDone: () => void;
  onWithdrawn?: () => void;
}

type Phase = 'submitting' | 'submitted' | 'failed';

export default function ReviewStep({
  amount,
  pin,
  reference,
  onDone,
  onWithdrawn,
}: ReviewStepProps) {
  const t = useTranslations('buyer.wallet.withdraw.review');
  const [phase, setPhase] = useState<Phase>('submitting');
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);

  const submit = useCallback(async () => {
    setPhase('submitting');
    setError(null);
    try {
      await apiFetch('wallet/withdraw', {
        method: 'POST',
        body: { amount, pin, reference },
      });
      setPhase('submitted');
      onWithdrawn?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Withdrawal failed. Please try again.');
      setPhase('failed');
    }
  }, [amount, pin, reference, onWithdrawn]);

  // Submit once when the review step mounts; the retry button re-sends the SAME
  // reference, which the server dedupes.
  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;
    void submit();
  }, [submit]);

  if (phase === 'failed') {
    return (
      <div className="p-6 flex flex-col items-center text-center space-y-4">
        <h3 className="text-lg font-semibold">Withdrawal not completed</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="flex w-full justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onDone}>
            {t('done')}
          </Button>
          <Button onClick={() => void submit()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center text-center space-y-4">
      {/* Hourglass illustration */}
      <div className="flex h-24 w-24 items-center justify-center">
        {phase === 'submitting' ? (
          <MiniSpinner className="h-10 w-10" />
        ) : (
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="40" fill="#EFF6FF" />
            <rect x="32" y="25" width="36" height="6" rx="2" fill="#3B82F6" />
            <rect x="32" y="69" width="36" height="6" rx="2" fill="#3B82F6" />
            <path d="M36 31 L50 50 L64 31 Z" fill="#FBBF24" opacity="0.3" />
            <path d="M36 31 L50 50 L64 31" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" fill="none" />
            <path d="M36 69 L50 50 L64 69 Z" fill="#FBBF24" opacity="0.6" />
            <path d="M36 69 L50 50 L64 69" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" fill="none" />
            <path d="M42 69 L50 58 L58 69 Z" fill="#F59E0B" />
            <line x1="50" y1="50" x2="50" y2="56" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {phase === 'submitting' ? 'Processing your withdrawal…' : t('title')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {phase === 'submitting'
            ? 'Please don’t close this window.'
            : t('body')}
        </p>
      </div>

      <div className="flex justify-end w-full pt-2">
        <Button onClick={onDone} disabled={phase === 'submitting'}>
          {t('done')}
        </Button>
      </div>
    </div>
  );
}

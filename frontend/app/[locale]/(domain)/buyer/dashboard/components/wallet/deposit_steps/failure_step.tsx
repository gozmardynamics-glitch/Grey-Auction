'use client';

import { XCircle } from 'lucide-react';

import { Button } from '@/shared/components/common';
import { useTranslations } from 'next-intl';

interface FailureStepProps {
  onRetry: () => void;
}

export default function DepositFailureStep({ onRetry }: FailureStepProps) {
  const t = useTranslations('buyer.wallet.deposit.failure');

  return (
    <div className="p-6 flex flex-col items-center text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <XCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold">{t('title')}</h3>
      <p className="text-sm text-muted-foreground">
        {t('body')}
      </p>
      <Button className="w-full" onClick={onRetry}>
        {t('tryAgain')}
      </Button>
    </div>
  );
}

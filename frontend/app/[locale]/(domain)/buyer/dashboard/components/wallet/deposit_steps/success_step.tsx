'use client';

import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/shared/components/common';
import { useTranslations } from 'next-intl';

interface SuccessStepProps {
  onDone: () => void;
}

export default function DepositSuccessStep({ onDone }: SuccessStepProps) {
  const t = useTranslations('buyer.wallet.deposit.success');

  return (
    <div className="p-6 flex flex-col items-center text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tertiary/10">
        <CheckCircle2 className="h-8 w-8 text-tertiary-1" />
      </div>
      <h3 className="text-lg font-semibold">{t('title')}</h3>
      <p className="text-sm text-muted-foreground">
        {t('body')}
      </p>
      <Button className="w-full" onClick={onDone}>
        {t('done')}
      </Button>
    </div>
  );
}

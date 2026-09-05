'use client';

import { useState } from 'react';
import {
  Button,
  DialogHeader,
  DialogTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Label,
} from '@/shared/components/common';
import { useTranslations } from 'next-intl';

const MOCK_EMAIL = 'jaydennicholas@gmail.com';

interface VerifyBankStepProps {
  onNext: () => void;
}

export default function VerifyBankStep({ onNext }: VerifyBankStepProps) {
  const t = useTranslations('wallet.addAccount.verifyBank');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="p-6 space-y-5">
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
      </DialogHeader>

      <p className="text-sm text-muted-foreground">
        {t('prompt', { email: MOCK_EMAIL })}
      </p>

      <div className="space-y-2">
        <Label>{t('code')}</Label>
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(val) => {
              setCode(val);
              if (error) setError('');
            }}
            numbersOnly
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {t('noCode')}{' '}
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto font-medium text-primary hover:underline"
        >
          {t('resend')}
        </Button>
      </p>

      <div className="flex justify-end pt-2">
        <Button disabled={code.length !== 6} onClick={onNext}>
          {t('verify')}
        </Button>
      </div>
    </div>
  );
}

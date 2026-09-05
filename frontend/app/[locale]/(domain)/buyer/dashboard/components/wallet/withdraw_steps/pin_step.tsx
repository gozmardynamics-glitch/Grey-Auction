'use client';

import { useState } from 'react';
import {
  Button,
  DialogHeader,
  DialogTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/shared/components/common';
import { useTranslations } from 'next-intl';

const MOCK_PIN = '1234';

interface PinStepProps {
  onNext: () => void;
  onBack: () => void;
  onForgotPin?: () => void;
}

export default function PinStep({ onNext, onBack, onForgotPin }: PinStepProps) {
  const t = useTranslations('buyer.wallet.withdraw.pin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (pin !== MOCK_PIN) {
      setError(t('invalid'));
      return;
    }
    onNext();
  };

  return (
    <div className="p-6 space-y-5">
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
      </DialogHeader>

      <p className="text-sm text-muted-foreground">
        {t('prompt')}
      </p>

      <div className="space-y-2">
        <div className="flex justify-center">
          <InputOTP
            maxLength={4}
            value={pin}
            onChange={(val) => {
              setPin(val);
              if (error) setError('');
            }}
            numbersOnly
          >
            <InputOTPGroup className="gap-3">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {t('forgot')}{' '}
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto font-medium text-primary hover:underline"
          onClick={onForgotPin}
        >
          {t('reset')}
        </Button>
        .
      </p>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>
          {t('cancel')}
        </Button>
        <Button disabled={pin.length !== 4} onClick={handleConfirm}>
          {t('confirm')}
        </Button>
      </div>
    </div>
  );
}

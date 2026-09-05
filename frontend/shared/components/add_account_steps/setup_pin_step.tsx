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

interface SetupPinStepProps {
  onNext: () => void;
  onCancel: () => void;
}

export default function SetupPinStep({ onNext, onCancel }: SetupPinStepProps) {
  const t = useTranslations('wallet.addAccount.setupPin');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const canSubmit =
    newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin;

  const handleConfirm = () => {
    if (newPin !== confirmPin) {
      setError(t('mismatch'));
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
        <Label className="text-primary">{t('enterNew')}</Label>
        <div className="flex justify-center">
          <InputOTP
            maxLength={4}
            value={newPin}
            onChange={setNewPin}
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
      </div>

      <div className="space-y-2">
        <Label>{t('confirmPin')}</Label>
        <div className="flex justify-center">
          <InputOTP
            maxLength={4}
            value={confirmPin}
            onChange={(val) => {
              setConfirmPin(val);
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

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button disabled={!canSubmit} onClick={handleConfirm}>
          {t('confirm')}
        </Button>
      </div>
    </div>
  );
}

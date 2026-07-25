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

const MOCK_PIN = '1234';

interface PinStepProps {
  onNext: () => void;
  onBack: () => void;
  onForgotPin?: () => void;
}

export default function PinStep({ onNext, onBack, onForgotPin }: PinStepProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (pin !== MOCK_PIN) {
      setError('Invalid PIN. Please try again.');
      return;
    }
    onNext();
  };

  return (
    <div className="p-6 space-y-5">
      <DialogHeader>
        <DialogTitle>PIN</DialogTitle>
      </DialogHeader>

      <p className="text-sm text-muted-foreground">
        Enter your 4-digit withdrawal PIN to continue
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
        Forgot PIN?{' '}
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto font-medium text-primary hover:underline"
          onClick={onForgotPin}
        >
          Reset
        </Button>
        .
      </p>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button disabled={pin.length !== 4} onClick={handleConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  );
}

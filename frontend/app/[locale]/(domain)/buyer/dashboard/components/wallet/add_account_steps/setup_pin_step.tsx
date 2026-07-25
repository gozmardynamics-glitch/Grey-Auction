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

interface SetupPinStepProps {
  onNext: () => void;
  onCancel: () => void;
}

export default function SetupPinStep({ onNext, onCancel }: SetupPinStepProps) {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const canSubmit =
    newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin;

  const handleConfirm = () => {
    if (newPin !== confirmPin) {
      setError('PINs do not match');
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
        You need to set a withdrawal PIN before making withdrawals.
      </p>

      <div className="space-y-2">
        <Label className="text-primary">Enter New PIN</Label>
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
        <Label>Confirm PIN</Label>
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
          Cancel
        </Button>
        <Button disabled={!canSubmit} onClick={handleConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  );
}

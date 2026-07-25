'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/shared/components/common';

import AddAccountStep from './add_account_step';
import VerifyBankStep from './verify_bank_step';
import SetupPinStep from './setup_pin_step';
import VerifyPinStep from './verify_pin_step';
import AccountSuccessStep from './account_success_step';

type AddAccountFlowStep =
  | 'add-account'
  | 'verify-bank'
  | 'setup-pin'
  | 'verify-pin'
  | 'account-success';

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddAccountModal({
  open,
  onOpenChange,
  onSuccess,
}: AddAccountModalProps) {
  const [step, setStep] = useState<AddAccountFlowStep>('add-account');

  useEffect(() => {
    if (open) {
      setStep('add-account');
    }
  }, [open]);

  const handleClose = () => onOpenChange(false);

  const handleDone = () => {
    onSuccess?.();
    handleClose();
  };

  const isCompactStep = step === 'account-success';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${isCompactStep ? 'max-w-sm' : 'max-w-md'} p-0`}
      >
        {step === 'add-account' && (
          <AddAccountStep
            onNext={() => setStep('verify-bank')}
            onCancel={handleClose}
          />
        )}

        {step === 'verify-bank' && (
          <VerifyBankStep onNext={() => setStep('setup-pin')} />
        )}

        {step === 'setup-pin' && (
          <SetupPinStep
            onNext={() => setStep('verify-pin')}
            onCancel={handleClose}
          />
        )}

        {step === 'verify-pin' && (
          <VerifyPinStep onNext={() => setStep('account-success')} />
        )}

        {step === 'account-success' && (
          <AccountSuccessStep onDone={handleDone} />
        )}
      </DialogContent>
    </Dialog>
  );
}

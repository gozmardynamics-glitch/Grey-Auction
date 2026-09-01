'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/shared/components/common';

// Add account flow steps (shared)
import AddAccountStep from '@/shared/components/add_account_steps/add_account_step';
import VerifyBankStep from '@/shared/components/add_account_steps/verify_bank_step';
import SetupPinStep from '@/shared/components/add_account_steps/setup_pin_step';
import VerifyPinStep from '@/shared/components/add_account_steps/verify_pin_step';
import AccountSuccessStep from '@/shared/components/add_account_steps/account_success_step';

// Withdraw flow steps
import AmountStep from './withdraw_steps/amount_step';
import PinStep from './withdraw_steps/pin_step';
import ReviewStep from './withdraw_steps/review_step';

// Reset PIN flow steps
import ForgotPinStep from './reset_pin_steps/forgot_pin_step';
import ResetPinStep from './reset_pin_steps/reset_pin_step';
import ResetPinSuccessStep from './reset_pin_steps/reset_pin_success_step';
import { BankAccountInfo, WithdrawStep } from '../../../models';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance?: number;
  bankAccount?: BankAccountInfo | null;
  hasPin?: boolean;
}

export default function WithdrawModal({
  open,
  onOpenChange,
  balance = 0,
  bankAccount = null,
  hasPin = false,
}: WithdrawModalProps) {
  const hasBankAccount = !!bankAccount;

  const getInitialStep = (): WithdrawStep => {
    if (hasBankAccount && hasPin) return 'amount';
    if (hasBankAccount) return 'setup-pin';
    return 'add-account';
  };

  const [step, setStep] = useState<WithdrawStep>(getInitialStep);

  const handleClose = () => onOpenChange(false);

  // Reset the flow when the modal opens.
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setStep(getInitialStep());
    onOpenChange(nextOpen);
  };

  const isCompactStep =
    step === 'review' ||
    step === 'account-success' ||
    step === 'reset-pin-success';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`${isCompactStep ? 'max-w-sm' : 'max-w-md'} p-0`}
      >
        {/* Add Account Flow */}
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
          <AccountSuccessStep onDone={handleClose} />
        )}

        {/* Withdraw Flow */}
        {step === 'amount' && (
          <AmountStep
            balance={balance}
            bankAccount={bankAccount}
            onNext={() => setStep('pin')}
            onCancel={handleClose}
            onAddAccount={() => setStep('add-account')}
          />
        )}

        {step === 'pin' && (
          <PinStep
            onNext={() => setStep('review')}
            onBack={() => setStep('amount')}
            onForgotPin={() => setStep('forgot-pin')}
          />
        )}

        {step === 'review' && <ReviewStep onDone={handleClose} />}

        {/* Reset PIN Flow */}
        {step === 'forgot-pin' && (
          <ForgotPinStep onNext={() => setStep('reset-pin')} />
        )}

        {step === 'reset-pin' && (
          <ResetPinStep
            onNext={() => setStep('reset-pin-success')}
            onCancel={() => setStep('pin')}
          />
        )}

        {step === 'reset-pin-success' && (
          <ResetPinSuccessStep onGoToWithdraw={() => setStep('amount')} />
        )}
      </DialogContent>
    </Dialog>
  );
}

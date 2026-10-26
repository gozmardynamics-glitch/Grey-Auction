'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/shared/components/common';

// Add account flow steps (shared)
import AddAccountStep from '@/shared/components/add_account_steps/add_account_step';
import SetupPinStep from '@/shared/components/add_account_steps/setup_pin_step';
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
  /** Called after a withdrawal succeeds so the wallet can refresh its balance. */
  onWithdrawn?: () => void;
}

const newReference = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'wd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);

export default function WithdrawModal({
  open,
  onOpenChange,
  balance = 0,
  bankAccount = null,
  hasPin = false,
  onWithdrawn,
}: WithdrawModalProps) {
  const hasBankAccount = !!bankAccount;

  const getInitialStep = (): WithdrawStep => {
    if (hasBankAccount && hasPin) return 'amount';
    if (hasBankAccount) return 'setup-pin';
    return 'add-account';
  };

  const [step, setStep] = useState<WithdrawStep>(getInitialStep);
  // The flow's inputs, lifted so the review step can submit them. `reference`
  // is generated once per flow: a retry reuses it and the server dedupes.
  const [amount, setAmount] = useState(0);
  const [pin, setPin] = useState('');
  const [reference, setReference] = useState(newReference);
  // Filled once the account is saved, so the flow can continue without a reload.
  const [savedAccount, setSavedAccount] = useState<BankAccountInfo | null>(null);

  const handleClose = () => onOpenChange(false);

  // Reset the flow when the modal opens.
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setStep(getInitialStep());
      setAmount(0);
      setPin('');
      setReference(newReference());
    }
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
            // The account is persisted to the seller profile by the step
            // itself; the fake OTP "verification" hop is gone, so the flow no
            // longer pretends a bank confirmed anything.
            onNext={() => setStep('setup-pin')}
            onCancel={handleClose}
            onSaved={(account) => {
              setSavedAccount({
                name: account.bankName,
                bankName: account.bankName,
                maskedAccount: '••••' + account.accountNumber.slice(-4),
              });
            }}
          />
        )}

        {step === 'setup-pin' && (
          <SetupPinStep
            // The PIN is saved for real now, so there is nothing left to
            // "verify" with a fake code: go straight to withdrawing when we
            // already know the account, otherwise show the success screen.
            onNext={() =>
              setStep(bankAccount || savedAccount ? 'amount' : 'account-success')
            }
            onCancel={handleClose}
          />
        )}

        {step === 'account-success' && (
          <AccountSuccessStep onDone={handleClose} />
        )}

        {/* Withdraw Flow */}
        {step === 'amount' && (
          <AmountStep
            balance={balance}
            bankAccount={bankAccount ?? savedAccount}
            onNext={(value) => {
              setAmount(value);
              setStep('pin');
            }}
            onCancel={handleClose}
            onAddAccount={() => setStep('add-account')}
          />
        )}

        {step === 'pin' && (
          <PinStep
            onNext={(value) => {
              setPin(value);
              setStep('review');
            }}
            onBack={() => setStep('amount')}
            onForgotPin={() => setStep('forgot-pin')}
          />
        )}

        {step === 'review' && (
          <ReviewStep
            amount={amount}
            pin={pin}
            reference={reference}
            onDone={handleClose}
            onWithdrawn={onWithdrawn}
          />
        )}

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

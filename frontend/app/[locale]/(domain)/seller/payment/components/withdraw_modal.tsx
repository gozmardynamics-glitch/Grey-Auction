'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/shared/components/common';
import AmountStep from './steps/amount_step';
import PinStep from './steps/pin_step';
import ForgotPinStep from './steps/forgot_pin_step';
import ResetPinStep from './steps/reset_pin_step';
import PinResetSuccessStep from './steps/pin_reset_success_step';
import WithdrawalReviewStep from './steps/withdrawal_review_step';

// ---------- Types ----------

type WithdrawStep =
  | 'amount'
  | 'pin'
  | 'forgot-pin'
  | 'reset-pin'
  | 'pin-reset-success'
  | 'withdrawal-review';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
}

// ---------- Helpers ----------

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(value);

const PROCESSING_FEE_RATE = 0.015;
const MIN_AMOUNT = 500;

// ---------- Main Component ----------

export default function WithdrawModal({
  open,
  onOpenChange,
  availableBalance,
}: WithdrawModalProps) {
  const [step, setStep] = useState<WithdrawStep>('amount');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const numericAmount = parseFloat(amount) || 0;
  const processingFee = numericAmount * PROCESSING_FEE_RATE;
  const totalAmount = numericAmount + processingFee;
  const isValidAmount = numericAmount >= MIN_AMOUNT && numericAmount <= availableBalance;
  const showBreakdown = numericAmount >= MIN_AMOUNT;
  const amountError =
    amount.length > 0 && numericAmount > 0 && numericAmount < MIN_AMOUNT
      ? `Minimum amount is ₦${MIN_AMOUNT} or above`
      : '';

  const canReset =
    newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin;

  const resetState = () => {
    setStep('amount');
    setAmount('');
    setPin('');
    setForgotCode('');
    setNewPin('');
    setConfirmPin('');
  };

  const handleClose = (value: boolean) => {
    if (!value) resetState();
    onOpenChange(value);
  };

  // ---------- Render ----------

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`${
          step === 'pin-reset-success' || step === 'withdrawal-review'
            ? 'max-w-sm'
            : 'max-w-md'
        } p-0`}
      >
        {step === 'amount' && (
          <AmountStep
            availableBalance={availableBalance}
            amount={amount}
            onAmountChange={setAmount}
            numericAmount={numericAmount}
            processingFee={processingFee}
            totalAmount={totalAmount}
            isValidAmount={isValidAmount}
            showBreakdown={showBreakdown}
            amountError={amountError}
            formatCurrency={formatCurrency}
            onCancel={() => handleClose(false)}
            onConfirm={() => setStep('pin')}
          />
        )}

        {step === 'pin' && (
          <PinStep
            pin={pin}
            onPinChange={setPin}
            onForgotPin={() => {
              setPin('');
              setStep('forgot-pin');
            }}
            onCancel={() => setStep('amount')}
            onConfirm={() => setStep('withdrawal-review')}
          />
        )}

        {step === 'forgot-pin' && (
          <ForgotPinStep
            forgotCode={forgotCode}
            onForgotCodeChange={setForgotCode}
            onVerify={() => {
              setForgotCode('');
              setStep('reset-pin');
            }}
          />
        )}

        {step === 'reset-pin' && (
          <ResetPinStep
            newPin={newPin}
            onNewPinChange={setNewPin}
            confirmPin={confirmPin}
            onConfirmPinChange={setConfirmPin}
            canReset={canReset}
            onCancel={() => setStep('pin')}
            onReset={() => setStep('pin-reset-success')}
          />
        )}

        {step === 'pin-reset-success' && (
          <PinResetSuccessStep
            onGoToWithdraw={() => {
              setNewPin('');
              setConfirmPin('');
              setStep('amount');
            }}
          />
        )}

        {step === 'withdrawal-review' && (
          <WithdrawalReviewStep onGoToPayment={() => handleClose(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

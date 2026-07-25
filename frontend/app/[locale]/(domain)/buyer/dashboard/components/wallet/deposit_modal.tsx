'use client';

import { useState } from 'react';

import {
  ActionSuccessDialog,
  Dialog,
  DialogContent,
} from '@/shared/components/common';

import DepositAmountStep from './deposit_steps/amount_step';
import type { PaymentMethodOption } from './deposit_steps/amount_step';
import DepositConfirmStep from './deposit_steps/confirm_step';
import DepositSuccessStep from './deposit_steps/success_step';
import DepositFailureStep from './deposit_steps/failure_step';
import DirectDebitStep from './deposit_steps/direct_debit_step';
import DirectDebitAddressStep from './deposit_steps/direct_debit_address_step';
import DirectDebitConfirmStep from './deposit_steps/direct_debit_confirm_step';
import DirectDebitSuccessStep from './deposit_steps/direct_debit_success_step';
import { DepositStep } from '../../../models';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DepositModal({
  open,
  onOpenChange,
}: DepositModalProps) {
  const [step, setStep] = useState<DepositStep>('amount');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodOption>('bank-transfer');

  // Direct debit state
  const [ddAccountNumber, setDdAccountNumber] = useState('');
  const [ddBankName, setDdBankName] = useState('');
  const [errorOpen, setErrorOpen] = useState(false);

  const resetState = () => {
    setStep('amount');
    setAmount(0);
    setPaymentMethod('bank-transfer');
    setDdAccountNumber('');
    setDdBankName('');
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleAmountNext = (amt: number, method: PaymentMethodOption) => {
    setAmount(amt);
    setPaymentMethod(method);
    if (method === 'direct-debit') {
      setStep('direct-debit');
    } else {
      setStep('confirm');
    }
  };

  const handleConfirmDeposit = () => {
    const isSuccess = Math.random() > 0.2;
    setStep(isSuccess ? 'success' : 'failure');
  };

  const handleDirectDebitNext = (accountNumber: string, bankName: string) => {
    setDdAccountNumber(accountNumber);
    setDdBankName(bankName);
    setStep('direct-debit-address');
  };

  const handleDirectDebitError = () => {
    setErrorOpen(true);
  };

  const paymentMethodLabel =
    paymentMethod === 'bank-transfer'
      ? 'Bank Transfer'
      : paymentMethod === 'direct-debit'
        ? 'Direct Debit'
        : 'Card';

  const isCompactStep =
    step === 'success' ||
    step === 'failure' ||
    step === 'direct-debit-success';

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) handleClose();
          else onOpenChange(value);
        }}
      >
        <DialogContent
          className={`${isCompactStep ? 'max-w-sm' : 'max-w-md'} p-0`}
        >
          {step === 'amount' && (
            <DepositAmountStep
              onNext={handleAmountNext}
              onCancel={handleClose}
            />
          )}

          {step === 'confirm' && (
            <DepositConfirmStep
              amount={amount}
              paymentMethodLabel={paymentMethodLabel}
              onConfirm={handleConfirmDeposit}
              onBack={() => setStep('amount')}
            />
          )}

          {step === 'success' && <DepositSuccessStep onDone={handleClose} />}

          {step === 'failure' && (
            <DepositFailureStep onRetry={() => setStep('amount')} />
          )}

          {/* Direct Debit flow */}
          {step === 'direct-debit' && (
            <DirectDebitStep
              onNext={handleDirectDebitNext}
              onCancel={handleClose}
              onError={handleDirectDebitError}
            />
          )}

          {step === 'direct-debit-address' && (
            <DirectDebitAddressStep
              onNext={() => setStep('direct-debit-confirm')}
              onCancel={handleClose}
            />
          )}

          {step === 'direct-debit-confirm' && (
            <DirectDebitConfirmStep
              bankName={ddBankName}
              accountNumber={ddAccountNumber}
              onConfirm={() => setStep('direct-debit-success')}
              onCancel={handleClose}
            />
          )}

          {step === 'direct-debit-success' && (
            <DirectDebitSuccessStep onDone={handleClose} />
          )}
        </DialogContent>
      </Dialog>

      {/* BVN Mismatch Error Dialog */}
      <ActionSuccessDialog
        open={errorOpen}
        onOpenChange={setErrorOpen}
        variant="error"
        title="Error Occurred"
        message="This bank account name does not match your BVN."
        buttonLabel="Got It!"
      />
    </>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Button,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';

interface BankAccountInfo {
  name: string;
  bankName: string;
  maskedAccount: string;
}

const PROCESSING_FEE_RATE = 0.1;
const MINIMUM_WITHDRAWAL = 100;

interface AmountStepProps {
  balance: number;
  bankAccount: BankAccountInfo | null;
  onNext: (amount: number) => void;
  onCancel: () => void;
  onAddAccount: () => void;
}

export default function AmountStep({
  balance,
  bankAccount,
  onNext,
  onCancel,
  onAddAccount,
}: AmountStepProps) {
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  const amountNum = parseFloat(withdrawalAmount) || 0;
  const isAmountValid = amountNum >= MINIMUM_WITHDRAWAL && amountNum <= balance;
  const isInsufficientBalance = amountNum > 0 && amountNum > balance;
  const isBelowMinimum =
    amountNum > 0 && amountNum < MINIMUM_WITHDRAWAL && !isInsufficientBalance;
  const processingFee = amountNum * PROCESSING_FEE_RATE;
  const totalAmount = amountNum + processingFee;
  const showBreakdown = isAmountValid;

  return (
    <div className="p-6 space-y-5">
      <DialogHeader>
        <DialogTitle>Withdraw</DialogTitle>
      </DialogHeader>

      {/* Available Balance Bar */}
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <span className="text-sm text-muted-foreground">
          Available Balance:
        </span>
        <span className="text-sm font-medium">
          {formatCurrency(balance)}
        </span>
      </div>

      {/* Editable Amount */}
      <div className="flex flex-col items-center gap-1 py-2">
        <div className="flex items-baseline gap-0.5">
          <span className="text-3xl font-semibold">&#8358;</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={withdrawalAmount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '');
              setWithdrawalAmount(val);
            }}
            className="text-3xl font-semibold bg-transparent border-none outline-none text-center w-40 placeholder:text-muted-foreground"
          />
        </div>
        {!isInsufficientBalance && !isBelowMinimum && (
          <p className="text-sm text-muted-foreground">Enter Amount</p>
        )}
        {isInsufficientBalance && (
          <p className="text-sm text-destructive font-medium">
            Insufficient Balance
          </p>
        )}
        {isBelowMinimum && (
          <p className="text-sm text-destructive font-medium">
            A minimum amount of &#8358;{MINIMUM_WITHDRAWAL} is allowed
          </p>
        )}
      </div>

      {/* Bank Account */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Bank Account</p>
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-semibold text-primary">
                {(bankAccount?.name ?? 'JN')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">
                {bankAccount?.name ?? 'Jayden Nicholas'}
              </p>
              <p className="text-xs text-muted-foreground">
                {bankAccount?.bankName ?? 'Wema Bank'}:{' '}
                {bankAccount?.maskedAccount ?? '******6789'}
              </p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto text-sm font-medium"
          onClick={onAddAccount}
        >
          Add Bank Account
        </Button>
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-semibold">Breakdown</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span>{formatCurrency(amountNum)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Processing Fee</span>
            <span>{formatCurrency(processingFee)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total Amount</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!isAmountValid}
          onClick={() => onNext(amountNum)}
        >
          Confirm Withdraw
        </Button>
      </div>
    </div>
  );
}

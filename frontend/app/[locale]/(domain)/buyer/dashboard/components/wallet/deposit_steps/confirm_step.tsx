'use client';

import {
  Button,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@/shared/components/common';

import { formatCurrency } from '@/shared/utils/helpers';

const PROCESSING_FEE_RATE = 0.015;

interface ConfirmStepProps {
  amount: number;
  paymentMethodLabel: string;
  onConfirm: () => void;
  onBack: () => void;
}

export default function DepositConfirmStep({
  amount,
  paymentMethodLabel,
  onConfirm,
  onBack,
}: ConfirmStepProps) {
  const processingFee = amount * PROCESSING_FEE_RATE;
  const totalAmount = amount + processingFee;

  return (
    <div className="p-6 space-y-6">
      <DialogHeader>
        <DialogTitle>Confirm Deposit</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium">{formatCurrency(amount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-medium">{paymentMethodLabel}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Processing Fee</span>
            <span className="font-medium">{formatCurrency(processingFee)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total Amount</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>Confirm Deposit</Button>
      </div>
    </div>
  );
}

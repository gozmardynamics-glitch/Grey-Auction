'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@/shared/components/common';

import { formatCurrency } from '@/shared/utils/helpers';

interface DirectDebitConfirmStepProps {
  bankName: string;
  accountNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const MANDATE_AMOUNT = 100_053;
const MANDATE_ACCOUNT = '0123456789';
const MANDATE_NAME = 'NIBSS MANDATE ACTIVATION';

export default function DirectDebitConfirmStep({
  bankName,
  accountNumber,
  onConfirm,
  onCancel,
}: DirectDebitConfirmStepProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="p-6 space-y-5">
      <DialogHeader>
        <DialogTitle>Confirm Process</DialogTitle>
        <DialogDescription>
          Send ₦50 only from your {bankName} - {accountNumber} to confirm your
          account linking.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border">
        {/* Bank header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <span className="text-xs font-bold text-primary">
              {bankName.charAt(0)}
            </span>
          </div>
          <span className="text-sm font-medium">{bankName}</span>
        </div>

        <Separator />

        {/* Amount */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-sm font-medium">
              {formatCurrency(MANDATE_AMOUNT)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(String(MANDATE_AMOUNT))}
            className="text-muted-foreground hover:text-foreground"
          >
            <Copy className="size-4" />
          </button>
        </div>

        <Separator />

        {/* Account Number */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Account Number</p>
            <p className="text-sm font-medium">{MANDATE_ACCOUNT}</p>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(MANDATE_ACCOUNT)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Copy className="size-4" />
          </button>
        </div>

        <Separator />

        {/* Account Name */}
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">Account Name</p>
          <p className="text-sm font-medium">{MANDATE_NAME}</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>I Have Paid</Button>
      </div>
    </div>
  );
}

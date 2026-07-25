import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/common';

import ReceiptContent from './receipt_content';
import { ReceiptData, type WalletPayment } from '../../../models';

function toReceiptData(payment: WalletPayment): ReceiptData {
  const isDeposit = payment.type === 'Deposit';
  return {
    type: payment.type,
    amount: payment.amount,
    status: payment.status,
    referenceId: payment.referenceId,
    date: payment.date,
    method: payment.method,
    paymentName: payment.paymentName,
    ...(isDeposit
      ? {
          merchantName: 'Grey Automobile',
          merchantProvider: 'Paystack',
          paymentId: `PYT${payment.referenceId.replace('WTX-', '')}45678`,
          winningAmount: payment.amount,
          accountHolder: 'Jayden Nicholas',
        }
      : {
          accountHolder: 'Jayden Nicholas',
          bankInfo: 'Wema Bank: 1234567890',
          withdrawalId: `WD${payment.referenceId.replace('WTX-', '')}45678`,
        }),
  };
}

// ---------- Component ----------

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: WalletPayment | null;
}

export default function ReceiptModal({
  open,
  onOpenChange,
  payment,
}: ReceiptModalProps) {
  if (!payment) return null;

  const receiptData = toReceiptData(payment);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <div className="p-6 space-y-5">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          <ReceiptContent data={receiptData} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

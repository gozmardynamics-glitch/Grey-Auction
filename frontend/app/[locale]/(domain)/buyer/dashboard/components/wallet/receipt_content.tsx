import { Share2, Download } from 'lucide-react';
import { Badge, Button, Separator } from '@/shared/components/common';
import { formatCurrency, statusConfig } from '@/shared/utils/helpers';
import { ReceiptData } from '../../../models';

const PROCESSING_FEE_RATE = 0.01;

interface ReceiptContentProps {
  data: ReceiptData;
  onShare?: () => void;
  onDownload?: () => void;
}

export default function ReceiptContent({
  data,
  onShare,
  onDownload,
}: ReceiptContentProps) {
  const { label: statusLabel, className: statusClass } =
    statusConfig[data.status];
  const processingFee = data.amount * PROCESSING_FEE_RATE;
  const total = data.amount + processingFee;

  const isDeposit = data.type === 'Deposit';

  return (
    <div className="space-y-5">
      {/* Amount + Status */}
      <div className="flex items-start justify-between border-b border-dashed pb-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="text-xl font-semibold">
            {formatCurrency(data.amount + processingFee)}
          </p>
        </div>
        <Badge variant="outline" className={statusClass}>
          {statusLabel}
        </Badge>
      </div>

      {/* User / Merchant Info */}
      <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <span className="text-sm font-semibold text-primary">
            {isDeposit
              ? (data.merchantName ?? 'GA')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
              : (data.accountHolder ?? 'JN')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium">
            {isDeposit
              ? (data.merchantName ?? 'Grey Automobile')
              : (data.accountHolder ?? 'Jayden Nicholas')}
          </p>
          <p className="text-xs text-muted-foreground">
            {isDeposit
              ? (data.merchantProvider ?? 'Paystack')
              : (data.bankInfo ?? 'Wema Bank: 1234567890')}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-semibold">Breakdown</p>
        {isDeposit && data.winningAmount !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Winning Amount</span>
            <span>{formatCurrency(data.winningAmount)}</span>
          </div>
        )}
        {!isDeposit && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span>{formatCurrency(data.amount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Processing Fee</span>
          <span>
            {isDeposit && data.winningAmount !== undefined
              ? `-${formatCurrency(processingFee)}`
              : formatCurrency(processingFee)}
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>
            {isDeposit
              ? 'Total Deposit'
              : data.status === 'Failed'
                ? 'Total'
                : 'Total Debit'}
          </span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Others */}
      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-semibold">Others</p>
        {isDeposit && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Name</span>
            <span>{data.accountHolder ?? 'Jayden Nicholas'}</span>
          </div>
        )}
        {isDeposit && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Method</span>
            <span>{data.method}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {isDeposit ? 'Payment ID' : 'Withdrawal ID'}
          </span>
          <span>
            {isDeposit
              ? (data.paymentId ?? 'PYT12345678')
              : (data.withdrawalId ?? 'WD12345678')}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Date</span>
          <span>{data.date}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Reference</span>
          <span>{data.referenceId}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onShare}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button onClick={onDownload}>
          <Download className="h-4 w-4" />
          Download Receipt
        </Button>
      </div>
    </div>
  );
}

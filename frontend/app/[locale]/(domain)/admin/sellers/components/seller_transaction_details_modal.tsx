import { Check, X } from 'lucide-react';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@/shared/components/common';

import {
  formatCurrency,
  statusStyles,
  stepColors,
} from '@/shared/utils/helpers';
import { SellerTransactionDetail, TimelineStep } from '../../models';

interface SellerTransactionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: SellerTransactionDetail | null;
  onApprove?: () => void;
  onReject?: () => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 py-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function TimelineItem({
  step,
  isLast,
}: {
  step: TimelineStep;
  isLast: boolean;
}) {
  const colors = stepColors[step.status];

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full ${colors.bg}`}
        >
          {step.status === 'completed' && <Check className="h-3.5 w-3.5" />}
          {step.status === 'failed' && <X className="h-3.5 w-3.5" />}
          {step.status === 'pending' && (
            <div className="h-2 w-2 rounded-full bg-white" />
          )}
        </div>
        {!isLast && <div className={`w-0.5 flex-1 ${colors.line}`} />}
      </div>
      <div className="pb-6">
        <p className="text-sm font-medium">{step.title}</p>
        <p className="text-xs text-muted-foreground">{step.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{step.date}</p>
      </div>
    </div>
  );
}

// ---------- Main Component ----------

export default function SellerTransactionDetailsModal({
  open,
  onOpenChange,
  transaction,
  onApprove,
  onReject,
}: SellerTransactionDetailsModalProps) {
  if (!transaction) return null;

  const isPending = transaction.status === 'Pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Transaction Details
            </DialogTitle>
            {isPending && (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={onApprove}>
                  Approve
                </Button>
                <Button variant="destructive" size="sm" onClick={onReject}>
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5 p-6 pt-4">
          {/* Amount & Status */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-2xl font-bold">
              {formatCurrency(transaction.amount)}
            </p>
            <Badge
              variant="outline"
              className={statusStyles[transaction.status]}
            >
              {transaction.status}
            </Badge>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Timeline</h3>
            <div className="mt-2">
              {transaction.timeline.map((step, index) => (
                <TimelineItem
                  key={index}
                  step={step}
                  isLast={index === transaction.timeline.length - 1}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Billing */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Billing</h3>
            <div>
              <InfoRow label="To" value={transaction.billing.to} />
              <InfoRow
                label="Payment Method"
                value={transaction.billing.paymentMethod}
              />
              <InfoRow label="Type" value={transaction.billing.type} />
              <InfoRow
                label="Transaction ID"
                value={transaction.billing.transactionId}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

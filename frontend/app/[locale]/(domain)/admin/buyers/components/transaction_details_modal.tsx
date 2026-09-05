import { useTranslations } from 'next-intl';
import { Check, RotateCcw } from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/common';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import { BuyerTransactionDetail, BuyerTimelineStep } from '../../models';


interface TransactionDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: BuyerTransactionDetail | null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col py-1">
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <p className="text-md font-semibold">{value}</p>
    </div>
  );
}

function TimelineItem({
  step,
  isLast,
}: {
  step: BuyerTimelineStep;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full ${
            step.completed
              ? 'bg-tertiary text-primary-foreground'
              : 'border-2 border-muted-foreground/30 bg-background'
          }`}
        >
          {step.completed && <Check className="h-3.5 w-3.5" />}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 flex-1 ${
              step.completed ? 'bg-tertiary' : 'bg-muted-foreground/20'
            }`}
          />
        )}
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

export default function TransactionDetailsModal({
  open,
  onOpenChange,
  transaction,
}: TransactionDetailsModalProps) {
  const t = useTranslations('admin.buyers.txn');
  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold">
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-6 pt-4">
          {/* Amount & Status */}
          <Card className="space-y-2 p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t('amount')}</p>
              <p className="text-2xl font-bold">
                {formatCurrency(transaction.amount)}
              </p>
            </div>
            <Badge
              variant="outline"
              className={statusStyles[transaction.status]}
            >
              {transaction.status}
            </Badge>
          </Card>

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t('timeline')}</h3>
            <Card className="mt-2 p-3">
              {transaction.timeline.map((step, index) => (
                <TimelineItem
                  key={index}
                  step={step}
                  isLast={index === transaction.timeline.length - 1}
                />
              ))}
            </Card>
          </div>

          {/* Billing */}
          <div className="space-y-3 p-2">
            <h3 className="text-sm font-semibold">{t('billing')}</h3>
            <Card className="p-3 lg:grid-cols-2 grid">
              <InfoRow label={t('to')} value={transaction.billing.id} />
              <InfoRow
                label={t('paymentGateway')}
                value={transaction.billing.paymentGateway}
              />
              <InfoRow label={t('type')} value={transaction.billing.deposit} />
              <InfoRow
                label={t('transactionId')}
                value={transaction.billing.transactionId}
              />
            </Card>
          </div>

          {/* Manage Transaction */}
          {transaction.status === 'Completed' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t('manage')}</h3>
              <Card className="p-3">
                <Button variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  {t('refund')}
                </Button>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

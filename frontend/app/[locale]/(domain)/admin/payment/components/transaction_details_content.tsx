import { RotateCcw } from 'lucide-react';
import { Badge, Button } from '@/shared/components/common';
import { formatCurrency, statusStyles } from '@/shared/utils/helpers';
import type { TransactionDetail } from '../../models';
import TransactionTimeline from './transaction_timeline';

interface TransactionDetailsContentProps {
  payment: TransactionDetail;
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function displayStatus(status: string) {
  if (status === 'Completed') return 'Successful';
  return status;
}

export default function TransactionDetailsContent({
  payment,
}: TransactionDetailsContentProps) {
  const isDeposit = payment.transactionType === 'Deposit';
  const isWithdraw = payment.transactionType === 'Withdraw';
  const isPending = payment.status === 'Pending';
  const isCompleted = payment.status === 'Completed';

  return (
    <div className="space-y-6">
      {/* Header with actions for Withdraw */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Transaction Details</h2>
        {isWithdraw && isPending && (
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Approve
            </Button>
            <Button size="sm" variant="destructive">
              Reject
            </Button>
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Amount Section */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-lg font-semibold">
              {formatCurrency(payment.amount)}
            </p>
          </div>
          <Badge
            variant="outline"
            className={statusStyles[displayStatus(payment.status)] ?? ''}
          >
            {displayStatus(payment.status)}
          </Badge>
        </div>
      </div>

      {/* Buyer / Seller Information */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">
          {isDeposit ? 'Buyer Information' : 'Seller Information'}
        </h3>
        <div className="rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-4">
            {isDeposit ? (
              <>
                <InfoField label="Buyer Name" value={payment.buyer} />
                <InfoField
                  label="Phone Number"
                  value={payment.buyerPhone || '-'}
                />
                <InfoField label="Email:" value={payment.buyerEmail || '-'} />
                <InfoField label="Buyer ID" value={payment.buyerId || '-'} />
              </>
            ) : (
              <>
                <InfoField label="Seller Name" value={payment.seller} />
                <InfoField
                  label="Phone Number"
                  value={payment.sellerPhone || '-'}
                />
                <InfoField label="Email:" value={payment.sellerEmail || '-'} />
                <InfoField label="Seller ID" value={payment.sellerId || '-'} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <TransactionTimeline
        paymentStatus={payment.status}
        transactionType={payment.transactionType}
        amount={payment.amount}
        date={payment.date}
      />

      {/* Billing */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Billing</h3>
        <div className="rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="To" value={payment.recipientName || '-'} />
            {isDeposit ? (
              <InfoField
                label="Payment Gateway"
                value={payment.paymentGateway || '-'}
              />
            ) : (
              <InfoField label="Payment Method" value={payment.method} />
            )}
            <InfoField
              label="Type"
              value={payment.transactionType}
            />
            <InfoField
              label="Transaction ID"
              value={payment.transactionId || '-'}
            />
          </div>
        </div>
      </div>

      {/* Manage Transaction */}
      {isDeposit && isCompleted && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Manage Transaction</h3>
          <Button variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Refund Payment
          </Button>
        </div>
      )}
    </div>
  );
}

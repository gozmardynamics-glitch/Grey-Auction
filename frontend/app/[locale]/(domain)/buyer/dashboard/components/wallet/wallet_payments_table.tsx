'use client';

import { useMemo, useState, useCallback } from 'react';
import { CreditCard } from 'lucide-react';

import {
  Badge,
  Button,
  DataTable,
} from '@/shared/components/common';
import {
  formatCurrency,
  statusStyles,
  typeClassName,
} from '@/shared/utils/helpers';
import { WalletPaymentColumns } from './wallet_payments_column';
import ReceiptModal from './receipt_modal';
import { WalletPayment } from '../../../models';

interface WalletPaymentsTableProps {
  data: WalletPayment[];
  globalFilter?: string;
}

function PaymentMobileCard({
  payment,
  onViewDetails,
}: {
  payment: WalletPayment;
  onViewDetails: (payment: WalletPayment) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">{payment.paymentName}</span>
        <Badge variant="outline" className={typeClassName[payment.type]}>
          {payment.type}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Reference ID</dt>
          <dd className="font-medium">{payment.referenceId}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Method</dt>
          <dd className="font-medium">{payment.method}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Amount</dt>
          <dd className="font-medium">{formatCurrency(payment.amount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Date</dt>
          <dd className="font-medium">{payment.date}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-2 pt-1">
        <Badge variant="outline" className={statusStyles[payment.status]}>
          {payment.status}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(payment)}
        >
          View details
        </Button>
      </div>
    </div>
  );
}

export default function WalletPaymentsTable({
  data,
  globalFilter = '',
}: WalletPaymentsTableProps) {
  const [selectedPayment, setSelectedPayment] = useState<WalletPayment | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const handleViewDetails = useCallback((payment: WalletPayment) => {
    setSelectedPayment(payment);
    setReceiptOpen(true);
  }, []);

  const columns = useMemo(
    () => WalletPaymentColumns(handleViewDetails),
    [handleViewDetails]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        globalFilter={globalFilter}
        mobileCards={(payment) => (
          <PaymentMobileCard
            payment={payment}
            onViewDetails={handleViewDetails}
          />
        )}
        emptyIcon={<CreditCard className="h-10 w-10" />}
        emptyTitle="No wallet activity yet"
        emptyDescription="Deposit to get started — your wallet transactions will appear here once you make a deposit or withdrawal."
      />
      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        payment={selectedPayment}
      />
    </>
  );
}

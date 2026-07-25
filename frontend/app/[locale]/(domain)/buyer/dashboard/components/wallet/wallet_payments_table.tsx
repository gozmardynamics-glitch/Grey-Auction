'use client';

import { useMemo, useState, useCallback } from 'react';
import { CreditCard } from 'lucide-react';

import { DataTable } from '@/shared/components/common';
import { WalletPaymentColumns } from './wallet_payments_column';
import ReceiptModal from './receipt_modal';
import { WalletPayment } from '../../../models';

interface WalletPaymentsTableProps {
  data: WalletPayment[];
  globalFilter?: string;
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
        emptyIcon={<CreditCard className="h-10 w-10" />}
        emptyTitle="No Transactions Yet"
        emptyDescription="Your wallet transactions will appear here once you make a deposit or withdrawal."
      />
      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        payment={selectedPayment}
      />
    </>
  );
}

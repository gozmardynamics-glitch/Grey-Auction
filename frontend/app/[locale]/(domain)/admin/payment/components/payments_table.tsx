'use client';

import { useMemo, useState } from 'react';
import { CreditCard } from 'lucide-react';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { Payment, TransactionDetail } from '../../models';
import { Columns } from './payments_column';
import TransactionDetailsModal from './transaction_details_modal';

interface PaymentsTableProps {
  data: Payment[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

export default function PaymentsTable({
  data,
  tabFilters,
  title,
}: PaymentsTableProps) {
  const [selectedPayment, setSelectedPayment] =
    useState<TransactionDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const columns = useMemo(
    () =>
      Columns((payment) => {
        setSelectedPayment(payment as TransactionDetail);
        setDetailsOpen(true);
      }),
    []
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        tabFilters={tabFilters}
        title={title}
        emptyIcon={<CreditCard className="h-10 w-10" />}
        emptyTitle="No Payments Available"
        emptyDescription="New payments will appear here once transactions are processed."
      />

      <TransactionDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        payment={selectedPayment}
      />
    </>
  );
}

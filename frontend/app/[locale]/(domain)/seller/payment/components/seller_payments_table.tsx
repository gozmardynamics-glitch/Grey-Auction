'use client';

import { useMemo, useState } from 'react';
import { CreditCard } from 'lucide-react';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { Payment } from '@/app/[locale]/(domain)/admin/models';
import { Columns } from './seller_payments_column';
import SellerPaymentDetailsModal, {
  type PaymentDetail,
} from './seller_payment_details_modal';

interface SellerPaymentsTableProps {
  data: Payment[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

export default function SellerPaymentsTable({
  data,
  tabFilters,
  title,
}: SellerPaymentsTableProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetail | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const columns = useMemo(
    () =>
      Columns((payment) => {
        const paymentDetail: PaymentDetail = {
          ...payment,
        };
        setSelectedPayment(paymentDetail);
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

      <SellerPaymentDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        payment={selectedPayment}
      />
    </>
  );
}

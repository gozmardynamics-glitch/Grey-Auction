'use client';

import { useMemo } from 'react';
import { Receipt } from 'lucide-react';

import { DataTable } from '@/shared/components/common';

import { purchasesColumns } from './purchases_column';
import { purchases_data } from '../../../models/data';
import { PurchaseInvoice } from '../../../models';

interface PurchasesTableProps {
  onViewInvoice: (invoice: PurchaseInvoice) => void;
}

export default function PurchasesTable({ onViewInvoice }: PurchasesTableProps) {
  const columns = useMemo(
    () => purchasesColumns((invoice) => onViewInvoice(invoice)),
    [onViewInvoice]
  );

  return (
    <div className="p-6">
      <DataTable
        columns={columns}
        data={purchases_data}
        title="Purchase"
        searchPlaceholder="Search for invoice"
        emptyIcon={<Receipt className="h-10 w-10" />}
        emptyTitle="No Purchases Yet"
        emptyDescription="Your purchase invoices will appear here once you win an auction."
      />
    </div>
  );
}

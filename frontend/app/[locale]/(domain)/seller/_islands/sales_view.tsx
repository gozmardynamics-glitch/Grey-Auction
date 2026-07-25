'use client';

import { useMemo, useState } from 'react';
import { Download, Receipt } from 'lucide-react';
import {
  Button,
  DataTable,
} from '@/shared/components/common';
import dynamic from 'next/dynamic';
import { Sale } from '../models';

const ReceiptModal = dynamic(() => import('../sales/components/receipt_modal'));
import { createColumns } from '../sales/components/sales_column';
import { DatePickerSimple } from '@/shared/components/common/date_picker';

interface SalesViewProps {
  sales: Sale[];
}

export default function SalesView({ sales }: SalesViewProps) {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const handleViewReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setReceiptOpen(true);
  };

  const columns = useMemo(
    () => createColumns({ onViewReceipt: handleViewReceipt }),
    []
  );

  const handleExport = () => {
    console.log('Exporting sales data...');
  };

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
        <div className="flex items-center gap-2">
          <DatePickerSimple />
          <Button onClick={handleExport} size="lg" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sales}
        title="All Transactions"
        emptyIcon={<Receipt className="h-10 w-10" />}
        emptyTitle="No Transactions Yet"
        emptyDescription="Your sales transactions will appear here once buyers complete purchases."
      />

      {/* Receipt modal */}
      <ReceiptModal
        sale={selectedSale}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </>
  );
}

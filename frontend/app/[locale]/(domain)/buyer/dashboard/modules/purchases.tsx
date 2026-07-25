'use client';

import { useState } from 'react';
import PurchasesTable from '../components/purchases/purchases_table';
import PurchaseDetail from '../components/purchases/purchase_detail';
import type { PurchaseInvoice } from '../../models';

export default function BuyerPurchasesModule() {
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);

  if (selectedInvoice) {
    return (
      <PurchaseDetail
        invoice={selectedInvoice}
        onBack={() => setSelectedInvoice(null)}
      />
    );
  }

  return <PurchasesTable onViewInvoice={setSelectedInvoice} />;
}

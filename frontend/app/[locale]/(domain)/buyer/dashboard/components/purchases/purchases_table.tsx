'use client';

import { useEffect, useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';

import { DataTable, Skeleton } from '@/shared/components/common';

import { purchasesColumns } from './purchases_column';
import { purchases_data } from '../../../models/data';
import { PurchaseInvoice } from '../../../models';
import { useAppSelector } from '@/redux/store';

interface PurchasesTableProps {
  onViewInvoice: (invoice: PurchaseInvoice) => void;
}

interface BackendInvoice {
  id: string;
  invoice_number: string;
  buyer_id: string;
  seller_id: string;
  hammer_price: string;
  commission: string;
  vat: string;
  fixed_fee: string;
  total: string;
  status: string;
  issued_at: string;
  paid_at: string | null;
}

const statusMap: Record<string, PurchaseInvoice['status']> = {
  issued: 'Pending',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export default function PurchasesTable({ onViewInvoice }: PurchasesTableProps) {
  const authUser = useAppSelector((state) => state.auth.user);
  const [invoices, setInvoices] = useState<PurchaseInvoice[] | null>(null);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${apiBase}/invoices?buyerId=${authUser?.id ?? ''}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to load invoices');
        const json = await res.json();
        const data: BackendInvoice[] = json.data || [];

        if (data.length === 0) {
          setInvoices(purchases_data);
          return;
        }

        const mapped: PurchaseInvoice[] = data.map((inv) => ({
          id: inv.id,
          invoiceId: inv.invoice_number,
          image: '/placeholder.svg',
          item: `Auction item (${inv.invoice_number})`,
          vendor: 'Grey Auction',
          amount: Number(inv.total),
          date: inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('en-GB') : '—',
          status: statusMap[inv.status] ?? 'Pending',
        }));
        setInvoices(mapped);
      } catch {
        // Fallback to demo data when backend is unreachable
        setInvoices(purchases_data);
      }
    };
    loadInvoices();
  }, [authUser?.id]);

  const columns = useMemo(
    () => purchasesColumns((invoice) => onViewInvoice(invoice)),
    [onViewInvoice]
  );

  if (invoices === null) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <DataTable
        columns={columns}
        data={invoices}
        title="Purchase"
        searchPlaceholder="Search for invoice"
        emptyIcon={<Receipt className="h-10 w-10" />}
        emptyTitle="No Purchases Yet"
        emptyDescription="Your purchase invoices will appear here once you win an auction."
      />
    </div>
  );
}

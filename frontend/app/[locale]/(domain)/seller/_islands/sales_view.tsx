'use client';

import { useMemo, useState, useEffect } from 'react';
import { Download, Receipt, FileText } from 'lucide-react';
import {
  Button,
  DataTable,
  Card,
  CardContent,
  Badge,
} from '@/shared/components/common';
import dynamic from 'next/dynamic';
import { Sale } from '../models';
import { useAppSelector } from '@/redux/store';
import { formatCurrency } from '@/shared/utils/helpers';
import { downloadInvoicePdf } from '@/shared/utils/invoice';

const ReceiptModal = dynamic(() => import('../sales/components/receipt_modal'));
import { createColumns } from '../sales/components/sales_column';
import { DatePickerSimple } from '@/shared/components/common/date_picker';

interface SalesViewProps {
  sales: Sale[];
}

interface SellerInvoice {
  id: string;
  invoice_number: string;
  hammer_price: string;
  commission: string;
  vat: string;
  fixed_fee: string;
  total: string;
  status: string;
  issued_at: string;
  paid_at: string | null;
}

export default function SalesView({ sales }: SalesViewProps) {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [invoices, setInvoices] = useState<SellerInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const authUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${apiBase}/invoices?sellerId=${authUser?.id ?? ''}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setInvoices(json.data || []);
      } catch {
        setInvoices([]);
      } finally {
        setLoadingInvoices(false);
      }
    };
    loadInvoices();
  }, [authUser?.id]);

  const handleViewReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setReceiptOpen(true);
  };

  const columns = useMemo(
    () => createColumns({ onViewReceipt: handleViewReceipt }),
    []
  );

  const handleExport = () => {
    
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

      {/* Invoices issued for this seller's auctions */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Auction Invoices
              {!loadingInvoices && invoices.length > 0 && (
                <Badge variant="outline">{invoices.length}</Badge>
              )}
            </h2>
          </div>

          {loadingInvoices ? (
            <div className="space-y-2 p-4">
              <div className="h-10 w-full animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded bg-muted" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Invoices will appear here when your auctions close and are settled.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Invoice</th>
                    <th className="px-4 py-2.5 font-medium">Hammer Price</th>
                    <th className="px-4 py-2.5 font-medium">Commission</th>
                    <th className="px-4 py-2.5 font-medium">VAT</th>
                    <th className="px-4 py-2.5 font-medium">Total</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{inv.invoice_number}</td>
                      <td className="px-4 py-2.5">{formatCurrency(Number(inv.hammer_price))}</td>
                      <td className="px-4 py-2.5">{formatCurrency(Number(inv.commission))}</td>
                      <td className="px-4 py-2.5">{formatCurrency(Number(inv.vat))}</td>
                      <td className="px-4 py-2.5 font-semibold">{formatCurrency(Number(inv.total))}</td>
                      <td className="px-4 py-2.5">
                        <Badge
                          className={
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700 border-0'
                              : inv.status === 'cancelled'
                                ? 'bg-red-100 text-red-700 border-0'
                                : 'bg-amber-100 text-amber-700 border-0'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-7 text-xs"
                          onClick={() => downloadInvoicePdf(inv.id)}
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt modal */}
      <ReceiptModal
        sale={selectedSale}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </>
  );
}

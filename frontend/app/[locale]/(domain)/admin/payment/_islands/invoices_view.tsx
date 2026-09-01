'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/shared/components/common/badge';
import { Button } from '@/shared/components/common/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/common/card';
import { MiniSpinner } from '@/shared/components/common/spinner';
import { formatCurrency } from '@/shared/utils/helpers';
import { downloadInvoicePdf } from '@/shared/utils/invoice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  buyer_id: string;
  seller_id: string;
  total: string;
  status: string;
  paid_at: string | null;
}

const statusMeta: Record<string, { label: string; className: string }> = {
  issued: { label: 'Issued', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  paid: { label: 'Paid', className: 'bg-tertiary/10 text-tertiary border-tertiary/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
};

const shortId = (value: string) =>
  value ? `${value.slice(0, 8)}…` : '—';

export default function InvoicesView() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(() => {
    fetch(`${API_URL}/invoices`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => setInvoices(json.data || []))
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDownload = async (id: string) => {
    try {
      await downloadInvoicePdf(id);
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <MiniSpinner />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoices
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No invoices available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Invoice #</th>
                  <th className="py-2 pr-4 font-medium">Buyer</th>
                  <th className="py-2 pr-4 font-medium">Seller</th>
                  <th className="py-2 pr-4 font-medium">Total</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Paid At</th>
                  <th className="py-2 font-medium">PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const meta = statusMeta[invoice.status] || statusMeta.issued;
                  return (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium text-primary">
                        {invoice.invoice_number}
                      </td>
                      <td className="py-2 pr-4">{shortId(invoice.buyer_id)}</td>
                      <td className="py-2 pr-4">{shortId(invoice.seller_id)}</td>
                      <td className="py-2 pr-4">
                        {formatCurrency(Number(invoice.total))}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </td>
                      <td className="py-2 pr-4">
                        {invoice.paid_at
                          ? new Date(invoice.paid_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(invoice.id)}
                        >
                          <Download className="mr-1 h-4 w-4" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Button, Card, DataTable, Skeleton } from '@/shared/components/common';
import { apiFetch } from '@/shared/utils/api-client';

import { useRecentInvoicesColumns } from './recent_invoices_column';
import type { InvoiceStatus, RecentInvoice } from '../../../models';

/** How many of the newest invoices the dashboard card shows. */
const RECENT_LIMIT = 5;

interface BackendInvoice {
  id: string;
  invoice_number: string;
  product_id: string;
  seller_id: string;
  total: string | number;
  status: string;
  issued_at: string;
}

interface ProductLite {
  title?: string;
  images?: string[];
  seller?: { name?: string } | null;
}

const statusMap: Record<string, InvoiceStatus> = {
  issued: 'Pending',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

async function describeInvoice(invoice: BackendInvoice): Promise<{
  item: string;
  image: string;
  vendor: string;
}> {
  const fallback = {
    item: `Invoice ${invoice.invoice_number}`,
    image: '/placeholder.svg',
    vendor: '—',
  };
  if (!invoice.product_id) return fallback;
  try {
    const json = await apiFetch<{ data: ProductLite }>(
      `products/${encodeURIComponent(invoice.product_id)}`
    );
    const product = json.data;
    if (!product) return fallback;
    return {
      item: product.title || fallback.item,
      image: product.images?.[0] || fallback.image,
      vendor: product.seller?.name || fallback.vendor,
    };
  } catch {
    // The lot is not readable (removed/private) — keep the invoice's own data.
    return fallback;
  }
}

export default function RecentInvoices() {
  const t = useTranslations('buyer.home');
  const tCommon = useTranslations('common');
  const recentInvoicesColumns = useRecentInvoicesColumns();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [invoices, setInvoices] = useState<RecentInvoice[] | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        // The server scopes the list to the caller; newest first.
        const json = await apiFetch<{ data: BackendInvoice[] }>('invoices');
        if (cancelled) return;
        const recent = (json.data ?? []).slice(0, RECENT_LIMIT);
        const descriptions = await Promise.all(recent.map(describeInvoice));
        if (cancelled) return;
        setInvoices(
          recent.map((invoice, index) => ({
            id: invoice.invoice_number,
            image: descriptions[index].image,
            item: descriptions[index].item,
            vendor: descriptions[index].vendor,
            amount: Number(invoice.total),
            date: invoice.issued_at
              ? new Date(invoice.issued_at).toLocaleDateString('en-GB')
              : '—',
            status: statusMap[invoice.status] ?? 'Pending',
          }))
        );
      } catch {
        // No demo invoices on money screens: an empty card is the honest answer.
        if (!cancelled) setInvoices([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  const rows = invoices ?? (status === 'unauthenticated' ? [] : null);

  return (
    <Card className="space-y-3 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('recentInvoices')}</h3>
        <Button variant="link" className="cursor-pointer">
          {tCommon('viewAll')}
        </Button>
      </div>
      {rows === null ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable
          columns={recentInvoicesColumns}
          data={rows}
          pagination={false}
          emptyIcon={<FileText className="h-10 w-10" />}
          emptyTitle={t('noInvoicesTitle')}
          emptyDescription={t('noInvoicesDescription')}
        />
      )}
    </Card>
  );
}

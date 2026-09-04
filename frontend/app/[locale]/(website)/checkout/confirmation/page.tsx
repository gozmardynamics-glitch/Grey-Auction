'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Clock3, SearchX, XCircle } from 'lucide-react';
import { Button, Card, CardContent } from '@/shared/components/common';
import { formatCurrency } from '@/shared/utils/helpers';
import Link from 'next/link';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface InvoiceState {
  id?: string;
  invoice_number?: string;
  total?: number | string;
  status?: string;
}

/**
 * Checkout confirmation (D2): reflects REAL server state. The buyer's invoice
 * is fetched with the session token (party-guarded API) and the page renders
 * paid / processing / failed honestly — including polling for a few seconds
 * because the provider webhook can land shortly after the redirect home.
 */
function ConfirmationContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const token = session?.user?.accessToken ?? null;
  const queryInvoiceId =
    searchParams.get('invoiceId') || searchParams.get('orderId') || '';
  const [invoiceId, setInvoiceId] = useState<string>(queryInvoiceId);
  const [invoice, setInvoice] = useState<InvoiceState | null>(null);
  const [settled, setSettled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fallback: the buy-now flow persists the invoice id in sessionStorage.
  useEffect(() => {
    if (invoiceId) return;
    try {
      const stored = sessionStorage.getItem('greyauction:buyNowInvoiceId');
      if (stored) setInvoiceId(stored);
    } catch {
      /* storage unavailable */
    }
  }, [invoiceId]);

  const loadInvoice = useCallback(async (id: string, bearer: string | null) => {
    try {
      const res = await fetch(`${apiBase}/invoices/${encodeURIComponent(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      return (json?.data ?? null) as InvoiceState | null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!invoiceId || !token) return;
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      const inv = await loadInvoice(invoiceId, token);
      if (cancelled) return;
      if (inv) setInvoice(inv);
      const status = inv?.status;
      if (status === 'paid' || status === 'cancelled') {
        setSettled(true);
        return;
      }
      // Still unpaid (or unfetchable): retry while the webhook may be in flight.
      if (attempts < 6) {
        timerRef.current = setTimeout(tick, 4000);
      } else {
        setSettled(true);
      }
    };
    tick();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [invoiceId, token, loadInvoice]);

  const status = invoice?.status;

  const state = (() => {
    if (status === 'paid') {
      return {
        icon: (
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </span>
        ),
        title: 'Payment confirmed!',
        body: invoice?.invoice_number
          ? `Invoice ${invoice.invoice_number} has been paid${invoice.total ? ` — ${formatCurrency(Number(invoice.total))}` : ''}. Your order is confirmed and the seller has been notified.`
          : 'Your payment has been received. Your order is confirmed and the seller has been notified — your invoice is available in your dashboard.',
        tone: 'text-foreground',
      } as const;
    }
    if (status === 'cancelled') {
      return {
        icon: (
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <XCircle className="h-9 w-9" />
          </span>
        ),
        title: 'Payment was not completed',
        body: 'This invoice was cancelled — you have not been charged. If you still want the item, start a new purchase from the lot page.',
        tone: 'text-foreground',
      } as const;
    }
    if (invoiceId && invoice) {
      // exists but still issued → processing
      return {
        icon: (
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Clock3 className="h-9 w-9" />
          </span>
        ),
        title: 'Payment processing',
        body: settled
          ? `We have not received the final confirmation for ${invoice.invoice_number || 'your invoice'} yet. If you completed the payment at the provider it will reflect in your dashboard shortly — you are not charged twice.`
          : 'Checking your payment status…',
        tone: 'text-foreground',
      } as const;
    }
    if (invoiceId) {
      return {
        icon: (
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <SearchX className="h-9 w-9" />
          </span>
        ),
        title: 'We could not confirm your payment yet',
        body: 'If you just completed a payment it may still be processing — check your dashboard for the invoice and payment status.',
        tone: 'text-foreground',
      } as const;
    }
    return {
      icon: (
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <SearchX className="h-9 w-9" />
        </span>
      ),
      title: 'Order not found',
      body: "We couldn't find a confirmed order for this session. If you just completed a payment it may still be processing — check your dashboard for your invoice.",
      tone: 'text-foreground',
    } as const;
  })();

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Card className="border border-border bg-card p-8 text-center shadow-xl">
        <CardContent className="space-y-4">
          {state.icon}
          <h1 className="text-2xl font-bold text-foreground">{state.title}</h1>
          <p className="text-sm text-muted-foreground">{state.body}</p>
          <div className="flex justify-center gap-3 pt-2">
            <Button asChild variant="outline">
              <Link href="/buyer/dashboard">View my purchases</Link>
            </Button>
            <Button asChild>
              <Link href="/auctions">Browse auctions</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutConfirmationPage() {
  return (
    <Suspense
      fallback={<div className="text-sm text-muted-foreground">Loading…</div>}
    >
      <ConfirmationContent />
    </Suspense>
  );
}

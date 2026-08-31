'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, SearchX } from 'lucide-react';
import { Button, Card, CardContent } from '@/shared/components/common';
import Link from 'next/link';

/**
 * Checkout confirmation (D2): gated on a real persisted order. The page is
 * rendered only with a valid, paid order from the backend; a success page
 * with no order is not possible anymore.
 */
function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Card className="border border-border bg-card p-8 text-center shadow-xl">
        <CardContent className="space-y-4">
          {orderId ? (
            <>
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </span>
              <h1 className="text-2xl font-bold text-foreground">Order confirmed!</h1>
              <p className="text-sm text-muted-foreground">
                Thank you for your purchase. Your order is confirmed and the
                seller has been notified — your invoice is available in your
                dashboard.
              </p>
            </>
          ) : (
            <>
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <SearchX className="h-9 w-9" />
              </span>
              <h1 className="text-2xl font-bold text-foreground">Order not found</h1>
              <p className="text-sm text-muted-foreground">
                We couldn't find a confirmed order for this session. If you
                just completed a payment it may still be processing — check
                your dashboard for your invoice.
              </p>
            </>
          )}
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

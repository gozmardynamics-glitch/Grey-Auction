import { CheckCircle2 } from 'lucide-react';
import { Button, Card, CardContent } from '@/shared/components/common';
import Link from 'next/link';

export default function CheckoutConfirmationPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Card className="border border-border bg-card p-8 text-center shadow-xl">
        <CardContent className="space-y-4">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h1 className="text-2xl font-bold text-foreground">Order confirmed!</h1>
          <p className="text-sm text-muted-foreground">
            Thank you for your purchase. If you won an auction, the seller will
            contact you to arrange pickup or delivery and your invoice is
            available in your dashboard.
          </p>
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

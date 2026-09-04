import { getOrderItems, getBuyerInvoice } from '@/lib/server/data';
import LatestAuctionsBanner from '../../components/latest_auctions';
import PaymentForm from '../../_islands/payment_form';

interface PaymentMethodPageProps {
  // Next.js async request API: searchParams is a Promise in server components.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PaymentMethodPage({ searchParams }: PaymentMethodPageProps) {
  const sp = await searchParams;
  const invoiceId = typeof sp.invoiceId === 'string' ? sp.invoiceId : undefined;
  // Server-rendered, session-authorized invoice: the Order Summary shows the
  // REAL fee-bearing total instead of the stubbed (empty) order items.
  const invoice = invoiceId ? await getBuyerInvoice(invoiceId) : null;
  const orderItems = await getOrderItems();

  return (
    <div className="min-h-screen">
      <div className="px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-foreground">
          Payment Method
        </h1>

        <PaymentForm orderItems={orderItems} invoice={invoice} />

        <div className="mt-12">
          <LatestAuctionsBanner />
        </div>
      </div>
    </div>
  );
}

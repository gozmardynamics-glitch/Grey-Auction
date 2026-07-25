import { getOrderItems } from '@/lib/server/data';
import LatestAuctionsBanner from '../../components/latest_auctions';
import PaymentForm from '../../_islands/payment_form';

export default async function PaymentMethodPage() {
  const orderItems = await getOrderItems();

  return (
    <div className="min-h-screen">
      <div className="px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-foreground">
          Payment Method
        </h1>

        <PaymentForm orderItems={orderItems} />

        <div className="mt-12">
          <LatestAuctionsBanner />
        </div>
      </div>
    </div>
  );
}

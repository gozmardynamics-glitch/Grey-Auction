import { getOrderItems } from '@/lib/server/data';
import CheckoutForm from '../_islands/checkout_form';
import LatestAuctionsBanner from '../components/latest_auctions';

export default async function CheckoutPage() {
  const orderItems = await getOrderItems();

  return (
    <div className="min-h-screen">
      <div className="px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-foreground">Checkout</h1>

        <CheckoutForm orderItems={orderItems} />

        <div className="mt-12">
          <LatestAuctionsBanner />
        </div>
      </div>
    </div>
  );
}

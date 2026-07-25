import { getCartItems } from '@/lib/server/data';
import CartClient from '../_islands/cart_client';
import LatestAuctionsBanner from '../components/latest_auctions';

export default async function CartPage() {
  const cartItems = await getCartItems();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[90%] px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-foreground">Cart</h1>

        <CartClient initialItems={cartItems} />

        {/* Banner */}
        <div className="mt-12">
          <LatestAuctionsBanner />
        </div>
      </div>
    </div>
  );
}

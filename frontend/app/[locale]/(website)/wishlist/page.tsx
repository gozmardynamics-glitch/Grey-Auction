import { getWishlistItems } from '@/lib/server/data';
import WishlistClient from '../_islands/wishlist_client';

export default async function Wishlist() {
  const auctions = await getWishlistItems();

  return (
    <div className=" space-y-8">
      <WishlistClient auctions={auctions} />
    </div>
  );
}

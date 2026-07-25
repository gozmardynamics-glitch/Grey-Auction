import { getAuctions } from '@/lib/server/data';
import AuctionListingClient from './auction_listing_client';

export default async function AuctionListingPage() {
  const auctions = await getAuctions();
  return <AuctionListingClient initialAuctions={auctions} />;
}

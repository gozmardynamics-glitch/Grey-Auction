import { getFeaturedAuctions, getCategories } from '@/lib/server/data';
import HomepageClientSection from './_islands/homepage_client_section';
import JoinAuction from './components/join_auction';
import TrustedBrands from './components/trusted_brands';
import CustomerStories from './components/customer_stories';
import JoinMarketplace from './components/join_marketplace_section';

export default async function WebsitePage() {
  const [auctions, categories] = await Promise.all([
    getFeaturedAuctions(),
    getCategories(),
  ]);

  return (
    <div className="px-4 py-6 sm:px-0 space-y-24">
      <HomepageClientSection auctions={auctions} categories={categories} />
      <JoinAuction />
      <TrustedBrands />
      <CustomerStories />
      <JoinMarketplace />
    </div>
  );
}

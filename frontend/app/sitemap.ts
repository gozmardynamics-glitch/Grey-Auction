import type { MetadataRoute } from 'next';
import { getAuctions } from '@/lib/server/data';
import {
  buildAuctionSitemapEntries,
  buildStaticSitemapEntries,
} from '@/lib/sitemap-routes';

/**
 * G34 — dynamic sitemap.xml.
 *
 * Every public page is emitted once per locale (next-intl localePrefix
 * "always" serves pages under /{en,fr,nl}/...) with hreflang alternates
 * declared on each entry, plus live auction detail pages from the API.
 * getAuctions() degrades to an empty list on API failure, so this route
 * always returns valid XML.
 */
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://greyauction.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const auctions = await getAuctions();

  return [
    ...buildStaticSitemapEntries(BASE_URL),
    ...buildAuctionSitemapEntries(BASE_URL, auctions),
  ];
}

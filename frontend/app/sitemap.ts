import type { MetadataRoute } from 'next';
import { getAuctions } from '@/lib/server/data';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://greyauction.com';

const staticPages: { path: string; priority: number; changefreq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/en', priority: 1, changefreq: 'daily' },
  { path: '/en/auctions', priority: 0.9, changefreq: 'hourly' },
  { path: '/en/blog', priority: 0.7, changefreq: 'weekly' },
  { path: '/en/career', priority: 0.5, changefreq: 'monthly' },
  { path: '/en/about-us', priority: 0.6, changefreq: 'monthly' },
  { path: '/en/contact', priority: 0.6, changefreq: 'monthly' },
  { path: '/en/faq', priority: 0.6, changefreq: 'monthly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const auctions = await getAuctions();

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changefreq,
    priority: page.priority,
  }));

  const auctionEntries: MetadataRoute.Sitemap = (auctions || [])
    .filter((auction: any) => auction?.slug)
    .map((auction: any) => ({
    url: `${BASE_URL}/en/auctions/${auction.slug}`,
    lastModified: auction.endTimeIso
      ? new Date(auction.endTimeIso)
      : auction.endTime
        ? new Date(auction.endTime)
        : new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...auctionEntries];
}

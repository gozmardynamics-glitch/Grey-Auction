/**
 * G34 — pure sitemap route math (no server-only imports so vitest can cover
 * it directly; `app/sitemap.ts` wires this to the live auction data).
 *
 * next-intl serves every page under /{en,fr,nl}/... (localePrefix "always"),
 * so each public route is emitted once per locale with hreflang alternates.
 */
import type { MetadataRoute } from 'next';

export const SITEMAP_LOCALES = ['en', 'fr', 'nl'] as const;
export type SitemapLocale = (typeof SITEMAP_LOCALES)[number];

export interface SitemapStaticRoute {
  /** Path WITHOUT locale prefix ('' = locale home). */
  path: string;
  priority: number;
  changeFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

/** Public, indexable routes (dashboard/auth/checkout are robots-disallowed). */
export const SITEMAP_STATIC_ROUTES: readonly SitemapStaticRoute[] = [
  { path: '', priority: 1, changeFrequency: 'daily' },
  { path: '/auctions', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/direct-sales', priority: 0.9, changeFrequency: 'daily' },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/about-us', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/advisors', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/career', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'monthly' },
  { path: '/subscribe', priority: 0.4, changeFrequency: 'monthly' },
];

function withBase(baseUrl: string, path: string): string {
  const clean = baseUrl.replace(/\/+$/, '');
  return path === '' ? clean + '/' : clean + path;
}

function alternatesFor(baseUrl: string, routePath: string): { languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const locale of SITEMAP_LOCALES) {
    languages[locale] = withBase(baseUrl, '/' + locale + routePath);
  }
  return { languages };
}

/** Static pages × locales, with hreflang alternates on every entry. */
export function buildStaticSitemapEntries(
  baseUrl: string,
  now: Date = new Date(),
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const route of SITEMAP_STATIC_ROUTES) {
    for (const locale of SITEMAP_LOCALES) {
      entries.push({
        url: withBase(baseUrl, '/' + locale + route.path),
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: alternatesFor(baseUrl, route.path),
      });
    }
  }
  return entries;
}

export interface SitemapAuctionLike {
  slug?: string;
  endTime?: string | Date;
  endTimeIso?: string;
}

/** Live auction lots × locales (slugs missing entries are skipped). */
export function buildAuctionSitemapEntries(
  baseUrl: string,
  auctions: readonly SitemapAuctionLike[] | null | undefined,
  now: Date = new Date(),
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const auction of auctions ?? []) {
    if (!auction?.slug) continue;
    const routePath = '/auctions/' + auction.slug;
    for (const locale of SITEMAP_LOCALES) {
      entries.push({
        url: withBase(baseUrl, '/' + locale + routePath),
        lastModified: auction.endTimeIso
          ? new Date(auction.endTimeIso)
          : auction.endTime
            ? new Date(auction.endTime)
            : now,
        changeFrequency: 'hourly',
        priority: 0.8,
        alternates: alternatesFor(baseUrl, routePath),
      });
    }
  }
  return entries;
}

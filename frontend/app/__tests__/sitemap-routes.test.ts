import { describe, it, expect } from 'vitest';
import {
  SITEMAP_LOCALES,
  SITEMAP_STATIC_ROUTES,
  buildStaticSitemapEntries,
  buildAuctionSitemapEntries,
} from '@/lib/sitemap-routes';

describe('sitemap route builder (G34)', () => {
  const base = 'https://greyauction.com';
  const now = new Date('2026-09-08T00:00:00Z');

  it('emits every static route once per locale with hreflang alternates', () => {
    const entries = buildStaticSitemapEntries(base, now);
    expect(entries.length).toBe(SITEMAP_STATIC_ROUTES.length * SITEMAP_LOCALES.length);

    const home = entries.find((e) => e.url === base + '/en')!;
    expect(home.priority).toBe(1);
    expect(home.alternates?.languages).toEqual({
      en: base + '/en',
      fr: base + '/fr',
      nl: base + '/nl',
    });
  });

  it('covers the previously-missing locales and pages', () => {
    const entries = buildStaticSitemapEntries(base, now);
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(base + '/fr/auctions');
    expect(urls).toContain(base + '/nl/direct-sales');
    expect(urls).toContain(base + '/en/privacy-policy');
    expect(urls).toContain(base + '/fr/terms');
    expect(urls).toContain(base + '/nl/subscribe');
  });

  it('maps auction slugs to all locales and skips slugless rows', () => {
    const entries = buildAuctionSitemapEntries(
      base,
      [
        { slug: 'vintage-rolex', endTimeIso: '2026-09-10T10:00:00Z' },
        { slug: undefined },
      ],
      now,
    );
    expect(entries.map((e) => e.url)).toEqual([
      base + '/en/auctions/vintage-rolex',
      base + '/fr/auctions/vintage-rolex',
      base + '/nl/auctions/vintage-rolex',
    ]);
    expect(entries[0].lastModified).toEqual(new Date('2026-09-10T10:00:00Z'));
  });

  it('degrades to an empty list when the API returns nothing', () => {
    expect(buildAuctionSitemapEntries(base, null, now)).toEqual([]);
    expect(buildAuctionSitemapEntries(base, undefined, now)).toEqual([]);
  });
});

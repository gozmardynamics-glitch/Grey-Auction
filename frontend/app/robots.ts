import type { MetadataRoute } from 'next';

/**
 * G34 — robots.txt generation.
 *
 * Dashboard/auth/API surfaces are auth-gated and carry no indexable content;
 * they are disallowed for crawlers. Both bare and locale-prefixed paths are
 * covered (next-intl serves pages under /{en,fr,nl}/...).
 */
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://greyauction.com';

const PRIVATE_PREFIXES = [
  'admin',
  'seller',
  'buyer',
  'checkout',
  'cart',
  'room',
  'invite',
  'auth',
  'api',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: PRIVATE_PREFIXES.flatMap((p) => ['/' + p, '/*/' + p]),
    },
    sitemap: BASE_URL + '/sitemap.xml',
    host: BASE_URL,
  };
}

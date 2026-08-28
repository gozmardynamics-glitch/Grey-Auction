import type { MetadataRoute } from 'next';

/**
 * Web App Manifest (L1 PWA base).
 * Served at /manifest.webmanifest by the App Router metadata convention.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GreyAuction — Live Auction Marketplace',
    short_name: 'GreyAuction',
    description:
      'Bid on vehicles, equipment and lots in live and timed auctions. Watch lots, get outbid alerts and buy now.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#1a1a2e',
    theme_color: '#1a1a2e',
    categories: ['shopping', 'business'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Live Auctions',
        short_name: 'Auctions',
        url: '/auctions',
      },
      {
        name: 'Wishlist',
        short_name: 'Wishlist',
        url: '/wishlist',
      },
    ],
  };
}

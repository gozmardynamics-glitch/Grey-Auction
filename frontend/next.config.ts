import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const isProd = process.env.NODE_ENV === 'production';

/**
 * Derive CSP connect-src origins from the configured API URL instead of
 * hardcoding localhost placeholders — and drop the previous wildcard
 * `https:` source, which allowed scripts to talk to any host.
 */
function originVariants(raw: string): string[] {
  try {
    const u = new URL(raw);
    const out = [u.origin];
    if (u.protocol === 'https:') out.push('wss://' + u.host);
    if (u.protocol === 'http:') out.push('ws://' + u.host);
    return out;
  } catch {
    return [];
  }
}

const apiOrigins = originVariants(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
);
// Dev-only origins (HMR/websockets + local API). Never emitted in a prod build.
const devOrigins = isProd
  ? []
  : [
      'http://localhost:3001',
      'ws://localhost:3001',
      'http://localhost:3000',
      'ws://localhost:3000',
    ];

const connectSrc = ["'self'", ...new Set([...apiOrigins, ...devOrigins])].join(
  ' ',
);

const csp = [
  "default-src 'self'",
  // 'unsafe-eval' is only needed by dev tooling (Turbopack HMR); prod builds
  // run fine with the inline hydration scripts alone.
  isProd
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com",
  `connect-src ${connectSrc}`,
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// next/image remote hosts: the API origin (serves /images/**) plus any extra
// hosts provided via NEXT_PUBLIC_IMAGE_HOSTS (comma-separated).
const apiHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
      .hostname;
  } catch {
    return null;
  }
})();
const extraImageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

interface RemotePattern {
  protocol: 'http' | 'https';
  hostname: string;
  pathname: string;
}
const remotePatterns: RemotePattern[] = [];
if (apiHost) {
  remotePatterns.push({ protocol: 'http', hostname: apiHost, pathname: '/**' });
  remotePatterns.push({
    protocol: 'https',
    hostname: apiHost,
    pathname: '/**',
  });
}
for (const hostname of extraImageHosts) {
  remotePatterns.push({ protocol: 'https', hostname, pathname: '/**' });
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.151'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
      {
        // Service worker must always be revalidated so SW updates roll out.
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns,
  },
};

export default withNextIntl(nextConfig);

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.151'],
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'your-api-domain.com',
    //     pathname: '/images/**',
    //   },
    // ],
  },
};

export default withNextIntl(nextConfig);

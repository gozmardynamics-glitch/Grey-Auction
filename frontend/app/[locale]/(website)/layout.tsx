import type { Metadata } from 'next';
import LayoutWrapper from '@/components/layouts/website/layout-wrapper';

export const metadata: Metadata = {
  title: 'Auction',
  description: 'Auction application',
};

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}

import { SellerDashboardWrapper } from '@/components/layouts/seller/seller_dashboard_wrapper';

export default function SellerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SellerDashboardWrapper>{children}</SellerDashboardWrapper>;
}

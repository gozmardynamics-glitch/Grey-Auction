import { AdminDashboardWrapper } from '@/components/layouts/admin/admin_dashboard_wrapper';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminDashboardWrapper>{children}</AdminDashboardWrapper>;
}

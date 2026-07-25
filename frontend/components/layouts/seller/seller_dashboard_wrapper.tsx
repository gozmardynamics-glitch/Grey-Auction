'use client';

import DashboardHeader from '@/components/layouts/seller/seller_header';
import MainSidebar from '@/components/layouts/seller/seller_sidebar';
import { SidebarProvider, SidebarInset } from '@/shared/components/common';

export function SellerDashboardWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar */}
        <MainSidebar />

        {/* Main Content Area */}
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          {/* Fixed Header */}
          <DashboardHeader />

          {/* Main Content with padding-top to account for fixed header */}
          <main className="flex-1 overflow-auto bg-card pt-23">
            <div className="p-6">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

'use client';

import { SidebarProvider, SidebarInset } from '@/shared/components/common';
import AdminSidebar from './admin_sidebar';
import AdminHeader from './admin_header';

export function AdminDashboardWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          {/* Fixed Header */}
          <AdminHeader />

          {/* Main Content with padding-top to account for fixed header */}
          <main className="flex-1 overflow-auto bg-card pt-23">
            <div className="p-6">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

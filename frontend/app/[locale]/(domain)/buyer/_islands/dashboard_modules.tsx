'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

import { Card, Skeleton } from '@/shared/components/common';
import { BuyerModuleKey } from '../models/buyer_modules';
import BuyerSettingsSidebar from '../dashboard/components/sidebar';

const moduleLoader = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-[200px] w-full rounded-lg" />
  </div>
);

const MODULE_MAP: Record<BuyerModuleKey, React.ComponentType> = {
  dashboard: dynamic(() => import('../dashboard/modules/dashboard'), {
    loading: moduleLoader,
  }),
  'my-bids': dynamic(() => import('../dashboard/modules/my_bids'), {
    loading: moduleLoader,
  }),
  invitations: dynamic(() => import('../dashboard/modules/invitations'), {
    loading: moduleLoader,
  }),
  wishlist: dynamic(() => import('../dashboard/modules/wishlist'), {
    loading: moduleLoader,
  }),
  chats: dynamic(() => import('../dashboard/modules/chats'), { loading: moduleLoader }),
  purchases: dynamic(() => import('../dashboard/modules/purchases'), {
    loading: moduleLoader,
  }),
  wallet: dynamic(() => import('../dashboard/modules/wallet'), {
    loading: moduleLoader,
  }),
  disputes: dynamic(() => import('../dashboard/modules/disputes'), {
    loading: moduleLoader,
  }),
  notifications: dynamic(() => import('../dashboard/modules/notifications'), {
    loading: moduleLoader,
  }),
  settings: dynamic(() => import('../dashboard/modules/settings'), {
    loading: moduleLoader,
  }),
};

export default function BuyerDashboardModules() {
  const [activeModule, setActiveModule] = useState<BuyerModuleKey>('dashboard');

  const ActiveComponent = MODULE_MAP[activeModule];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:h-[calc(100vh-220px)]">
      {/* Sidebar */}
      <BuyerSettingsSidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />

      {/* Content area */}
      <Card className="md:col-span-3 min-w-0 overflow-y-auto overflow-x-hidden">
        <ActiveComponent />
      </Card>
    </div>
  );
}

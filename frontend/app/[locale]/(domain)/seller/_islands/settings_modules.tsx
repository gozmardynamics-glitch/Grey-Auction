'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';

import { Card, Input, ScrollArea, Skeleton } from '@/shared/components/common';
import { SettingsModuleKey } from '../models/seller_settings';
import SettingsSidebar from '../settings/components/settings_sidebar';

const settingsLoader = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

const MODULE_MAP: Record<SettingsModuleKey, React.ComponentType> = {
  'my-profile': dynamic(() => import('../settings/components/modules/my_profile'), { loading: settingsLoader }),
  security: dynamic(() => import('../settings/components/modules/security'), { loading: settingsLoader }),
  store: dynamic(() => import('../settings/components/modules/store'), { loading: settingsLoader }),
  payments: dynamic(() => import('../settings/components/modules/payments'), { loading: settingsLoader }),
  'auction-payment': dynamic(() => import('../settings/components/modules/auction_payment'), { loading: settingsLoader }),
  notifications: dynamic(() => import('../settings/components/modules/notifications'), { loading: settingsLoader }),
  preferences: dynamic(() => import('../settings/components/modules/preferences'), { loading: settingsLoader }),
  'plan-packages': dynamic(() => import('../settings/components/modules/plan_packages'), { loading: settingsLoader }),
  'contact-us': dynamic(() => import('../settings/components/modules/contact_us'), { loading: settingsLoader }),
};

export default function SellerSettingsModules() {
  const [activeModule, setActiveModule] =
    useState<SettingsModuleKey>('my-profile');

  const ActiveComponent = MODULE_MAP[activeModule];

  return (
    <Card className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-180px)] overflow-hidden bg-card">
      {/* Sidebar */}
      <SettingsSidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />

      {/* Content area */}
      <div className="flex flex-1 flex-col">
        {/* Module header with search */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b px-4 sm:px-6 py-3">
          <h2 className="text-base font-semibold capitalize">
            {activeModule
              .replace('-', ' & ')
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="w-full sm:w-[180px] pl-9 bg-background h-9"
            />
          </div>
        </div>

        {/* Module content */}
        <ScrollArea className="flex-1">
          <ActiveComponent />
        </ScrollArea>
      </div>
    </Card>
  );
}

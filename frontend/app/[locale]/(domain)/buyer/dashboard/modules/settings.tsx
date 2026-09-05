'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Input,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/common';

import SettingsProfile from '../components/settings/settings_profile';
import SettingsSecurity from '../components/settings/settings_security';
import SettingsNotifications from '../components/settings/settings_notifications';
import SettingsPayment from '../components/settings/settings_payment';

export default function BuyerSettingsModule() {
  const t = useTranslations('buyer.settings');

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <div className="relative w-full sm:w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('search')} className="pl-9 h-9 bg-card" />
        </div>
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          JN
        </div>
        <div>
          <p className="text-sm font-semibold">Jayden Nicholas</p>
          <p className="text-xs text-muted-foreground">
            Jaydennicholas@gmail.com
          </p>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList className="bg-none">
          <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
          <TabsTrigger value="security">{t('tabs.security')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('tabs.notifications')}</TabsTrigger>
          <TabsTrigger value="payment">{t('tabs.payment')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <SettingsProfile />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SettingsSecurity />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <SettingsNotifications />
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <SettingsPayment />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useTranslations } from 'next-intl';

import AdminSettingsModules from '../_islands/settings_modules';

export default function SettingsPage() {
  const t = useTranslations('admin.settings');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
      <AdminSettingsModules />
    </div>
  );
}

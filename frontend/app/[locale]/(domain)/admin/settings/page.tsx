import AdminSettingsModules from '../_islands/settings_modules';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <AdminSettingsModules />
    </div>
  );
}

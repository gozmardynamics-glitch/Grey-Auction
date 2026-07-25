import BannersTable from './components/banners_table';
import AddBannerAction from '../_islands/add_banner_action';
import { getAdminBanners } from '@/lib/server/data';

const TAB_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

export default async function Banners() {
  const banners = await getAdminBanners();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
        <AddBannerAction />
      </div>

      <BannersTable data={banners} tabFilters={TAB_FILTERS} />
    </div>
  );
}

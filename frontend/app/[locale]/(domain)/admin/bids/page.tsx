import { getTranslations } from 'next-intl/server';
import BidsTable from './components/bids_table';
import { DatePickerSimple } from '@/shared/components/common/date_picker';
import { BID_TAB_FILTERS } from '../models/data';
import { getAdminBids } from '@/lib/server/data';

export default async function Bids() {
  const bids = await getAdminBids();
  const t = await getTranslations('admin.bids.page');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <div className="flex items-center gap-1">
          <DatePickerSimple />
        </div>
      </div>

      <BidsTable data={bids} tabFilters={BID_TAB_FILTERS} />
    </div>
  );
}

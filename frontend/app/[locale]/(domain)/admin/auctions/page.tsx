import { getTranslations } from 'next-intl/server';
import AuctionTable from './components/auction_table';
import { DatePickerSimple } from '@/shared/components/common/date_picker';
import { AUCTION_TAB_FILTERS } from '../models/data';
import { getAdminAuctions } from '@/lib/server/data';
import type { Auction as AdminAuction } from '../models';

export default async function AuctionManagement() {
  // data.ts normalizes to the shared website Auction shape; the table
  // declares its own structurally-identical Auction type.
  const auctions = (await getAdminAuctions()) as unknown as AdminAuction[];
  const t = await getTranslations('admin.auctions.page');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <div className="flex items-center gap-1">
          <DatePickerSimple />
        </div>
      </div>

      <AuctionTable data={auctions} tabFilters={AUCTION_TAB_FILTERS} />
    </div>
  );
}

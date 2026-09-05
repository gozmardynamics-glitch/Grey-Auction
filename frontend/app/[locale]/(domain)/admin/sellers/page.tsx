import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { Button } from '@/shared/components/common';

import SellersTable from './components/sellers_table';
import { TAB_FILTERS } from '../models/data';
import AddSellerAction from '../_islands/add_seller_action';
import { getAdminSellers } from '@/lib/server/data';

export default async function Sellers() {
  const t = useTranslations('admin.sellers.page');
  const sellers = await getAdminSellers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="lg" className="bg-background">
            <Upload />
            {t('export')}
          </Button>
          <AddSellerAction />
        </div>
      </div>

      <SellersTable data={sellers} tabFilters={TAB_FILTERS} />
    </div>
  );
}

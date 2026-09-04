'use client';

import { Gavel } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, Card, DataTable } from '@/shared/components/common';

import { useActiveAuctionsColumns } from './active_auctions_column';
import { buyer_active_auction_data } from '../../../models/data';

export default function ActiveAuctions() {
  const t = useTranslations('buyer.home');
  const tCommon = useTranslations('common');
  const activeAuctionsColumns = useActiveAuctionsColumns();
  return (
    <Card className="space-y-3 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('activeAuctions')}</h3>
        <Button variant="link" className="cursor-pointer">
          {tCommon('viewAll')}
        </Button>
      </div>
      <DataTable
        columns={activeAuctionsColumns}
        data={buyer_active_auction_data}
        pagination={false}
        emptyIcon={<Gavel className="h-10 w-10" />}
        emptyTitle={t('noActiveAuctionsTitle')}
        emptyDescription={t('noActiveAuctionsDescription')}
      />
    </Card>
  );
}

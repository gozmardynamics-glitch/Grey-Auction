'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
} from '@/shared/components/common';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useListedAuctionsColumns, type ListedAuctions } from './listed_auctions_column';

interface ListedAuctionsProps {
  data?: ListedAuctions[];
}

export default function ListedAuctionsComponent({ data = [] }: ListedAuctionsProps) {
  const t = useTranslations('seller.home');
  const columns = useListedAuctionsColumns();
  return (
    <Card className="">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{t('listedAuctions')}</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          pagination={false}
          emptyIcon={<FileText className="h-8 w-8" />}
          emptyTitle={t('noListedTitle')}
          emptyDescription={t('noListedDescription')}
        />
      </CardContent>
    </Card>
  );
}

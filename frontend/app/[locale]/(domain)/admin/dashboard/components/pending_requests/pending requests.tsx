import { ListFilter, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  EmptyState,
} from '@/shared/components/common';

import { usePendingRequestColumns, type PendingRequest } from './Pending_requests_column';

interface PendingRequestsProps {
  data?: PendingRequest[];
}

export default function PendingRequests({ data = [] }: PendingRequestsProps) {
  const t = useTranslations('admin.home');
  const columns = usePendingRequestColumns();
  return (
    <Card className=''>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">
          {t('pendingRequestsTitle')}
        </CardTitle>
        <Button variant="outline" size="sm" className="gap-2">
          <ListFilter className="h-4 w-4" />
          {t('sort')}
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title={t('noPendingTitle')}
            description={t('noPendingDescription')}
            className="py-12"
          />
        ) : (
          <DataTable
            columns={columns}
            data={data}
            pagination={false}
            showToolbar={false}
          />
        )}
      </CardContent>
    </Card>
  );
}
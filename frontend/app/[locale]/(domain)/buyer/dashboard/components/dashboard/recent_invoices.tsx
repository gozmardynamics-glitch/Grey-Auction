
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, Card, DataTable } from '@/shared/components/common';

import { useRecentInvoicesColumns } from './recent_invoices_column';
import { recent_invoice_data } from '../../../models/data';

export default function RecentInvoices() {
  const t = useTranslations('buyer.home');
  const tCommon = useTranslations('common');
  const recentInvoicesColumns = useRecentInvoicesColumns();
  return (
    <Card className="space-y-3 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('recentInvoices')}</h3>
        <Button variant="link" className="cursor-pointer">
          {tCommon('viewAll')}
        </Button>
      </div>
      <DataTable
        columns={recentInvoicesColumns}
        data={recent_invoice_data}
        pagination={false}
        emptyIcon={<FileText className="h-10 w-10" />}
        emptyTitle={t('noInvoicesTitle')}
        emptyDescription={t('noInvoicesDescription')}
      />
    </Card>
  );
}

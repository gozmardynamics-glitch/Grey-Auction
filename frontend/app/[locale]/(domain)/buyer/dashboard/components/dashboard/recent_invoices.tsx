
import { FileText } from 'lucide-react';

import { Button, Card, DataTable } from '@/shared/components/common';

import { recentInvoicesColumns } from './recent_invoices_column';
import { recent_invoice_data } from '../../../models/data';

export default function RecentInvoices() {
  return (
    <Card className="space-y-3 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Recent Invoices</h3>
        <Button variant="link" className="cursor-pointer">
          View All
        </Button>
      </div>
      <DataTable
        columns={recentInvoicesColumns}
        data={recent_invoice_data}
        pagination={false}
        emptyIcon={<FileText className="h-10 w-10" />}
        emptyTitle="No Invoices Yet"
        emptyDescription="Your recent invoices will appear here once you make a purchase."
      />
    </Card>
  );
}

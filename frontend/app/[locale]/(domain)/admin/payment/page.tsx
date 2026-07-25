import { Button } from '@/shared/components/common';

import PaymentsTable from './components/payments_table';
import PaymentStats from './components/payments_stats_card';
import { DatePickerSimple } from '@/shared/components/common/date_picker';
import { PAYMENT_TAB_FILTERS } from '../models/data';
import { getAdminPayments } from '@/lib/server/data';

export default async function Payments() {
  const payments = await getAdminPayments();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <div className="flex items-center gap-1">
          <DatePickerSimple />
          <Button size="lg">
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div>
        <PaymentStats payments={payments} />
      </div>

      <PaymentsTable data={payments} tabFilters={PAYMENT_TAB_FILTERS} />
    </div>
  );
}

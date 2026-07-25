import SellerPaymentStats from './components/seller_payments_stats';
import SellerPaymentsTable from './components/seller_payments_table';
import { DatePickerSimple } from '@/shared/components/common/date_picker';
import PaymentActions from '../_islands/payment_actions';
import { getSellerPayments } from '@/lib/server/data';

export default async function SellerPayment() {
  const payments = await getSellerPayments();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Payment</h1>
        <div className="flex items-center gap-1">
          <DatePickerSimple />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SellerPaymentStats payments={payments} />
        <PaymentActions payments={payments} />
      </div>

      <SellerPaymentsTable data={payments} title="Payments" />
    </div>
  );
}

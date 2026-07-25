import SalesView from '../_islands/sales_view';
import { getSellerSales } from '@/lib/server/data';

export default async function SalesPage() {
  const sales = await getSellerSales();

  return (
    <div className="space-y-8">
      <SalesView sales={sales} />
    </div>
  );
}

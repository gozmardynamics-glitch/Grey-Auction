import { Upload } from 'lucide-react';
import { Button } from '@/shared/components/common';

import BuyersTable from './components/buyers_table';
import { BUYER_TAB_FILTERS } from '../models/data';
import AddBuyerAction from '../_islands/add_buyer_action';
import { getAdminBuyers } from '@/lib/server/data';

export default async function Buyers() {
  const buyers = await getAdminBuyers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Buyers</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="lg" className="bg-background">
            <Upload />
            Export
          </Button>
          <AddBuyerAction />
        </div>
      </div>

      <BuyersTable data={buyers} tabFilters={BUYER_TAB_FILTERS} />
    </div>
  );
}

'use client';

import { Gavel } from 'lucide-react';
import { DataTable } from '@/shared/components/common';
import { myBidsColumns } from './my_bids_column';
import { data, MY_BIDS_FILTER_TABS } from '../../../models/data';

export default function MyBidsTable() {
  return (
    <div className="p-4">
      <DataTable
        columns={myBidsColumns}
        data={data}
        tabFilters={MY_BIDS_FILTER_TABS}
        searchPlaceholder="Search for lots"
        emptyIcon={<Gavel className="h-10 w-10" />}
        emptyTitle="No Bids Yet"
        emptyDescription="Your bids on auctions will appear here. Start bidding to track your activity."
      />
    </div>
  );
}

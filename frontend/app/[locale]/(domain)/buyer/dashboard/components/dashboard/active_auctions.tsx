'use client';

import { Gavel } from 'lucide-react';

import { Button, Card, DataTable } from '@/shared/components/common';

import { activeAuctionsColumns } from './active_auctions_column';
import { buyer_active_auction_data } from '../../../models/data';

export default function ActiveAuctions() {
  return (
    <Card className="space-y-3 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Active Auctions</h3>
        <Button variant="link" className="cursor-pointer">
          View All
        </Button>
      </div>
      <DataTable
        columns={activeAuctionsColumns}
        data={buyer_active_auction_data}
        pagination={false}
        emptyIcon={<Gavel className="h-10 w-10" />}
        emptyTitle="No Active Auctions"
        emptyDescription="Auctions you participate in will appear here."
      />
    </Card>
  );
}

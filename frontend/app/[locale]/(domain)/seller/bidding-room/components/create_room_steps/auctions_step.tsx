'use client';

import { useMemo, useCallback } from 'react';
import { ListRestart } from 'lucide-react';
import type { RowSelectionState } from '@tanstack/react-table';

import { Button, DataTable } from '@/shared/components/common';
import { DUMMY_LISTINGS } from '../../../models';
import { auctionColumns } from './auction_columns';

interface AuctionsStepProps {
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  onContinue: () => void;
}

export default function AuctionsStep({
  selectedIds,
  onChange,
  onContinue,
}: AuctionsStepProps) {
  const activeListings = useMemo(
    () =>
      DUMMY_LISTINGS.filter(
        (l) => l.status === 'Active' || l.status === 'Ending Soon'
      ),
    []
  );

  const rowSelection = useMemo<RowSelectionState>(
    () => Object.fromEntries(selectedIds.map((id) => [id, true])),
    [selectedIds]
  );

  const handleRowSelectionChange = useCallback(
    (selection: RowSelectionState) => {
      onChange(Object.keys(selection).filter((key) => selection[key]));
    },
    [onChange]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Auctions</h3>
        <Button variant="outline" size="sm" className="gap-2">
          Load Active Auctions
          <ListRestart className="h-4 w-4" />
        </Button>
      </div>

      <DataTable
        columns={auctionColumns}
        data={activeListings}
        title="Active Auctions"
        searchPlaceholder="Search"
        pagination={false}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        getRowId={(row) => row.lotId}
        emptyTitle="No active auctions"
        emptyDescription="Listings you put up for auction will appear here for the room."
      />

      <div className="flex justify-end">
        <Button disabled={selectedIds.length === 0} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

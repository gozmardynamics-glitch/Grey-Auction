'use client';

import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { Buyer, BuyerDetail } from '../../models';
import { Columns } from './buyers_column';
import BuyerDetailsModal from './buyer_details_modal';
import SuspendUserDialog from './suspend_user_dialog';
import ActivateUserDialog from './activate_user_dialog';

interface BuyersTableProps {
  data: Buyer[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

export default function BuyersTable({
  data,
  tabFilters,
  title,
}: BuyersTableProps) {
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [actionBuyer, setActionBuyer] = useState<Buyer | null>(null);

  const columns = useMemo(
    () =>
      Columns(
        (buyer) => {
          const buyerDetail: BuyerDetail = {
            ...buyer,
          };
          setSelectedBuyer(buyerDetail);
          setDetailsOpen(true);
        },
        (buyer) => {
          setActionBuyer(buyer);
          setSuspendOpen(true);
        },
        (buyer) => {
          setActionBuyer(buyer);
          setActivateOpen(true);
        }
      ),
    []
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        tabFilters={tabFilters}
        title={title}
        emptyIcon={<Users className="h-10 w-10" />}
        emptyTitle="No Buyers Available"
        emptyDescription="New buyers will appear here once they register on the platform."
      />

      <BuyerDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        buyer={selectedBuyer}
      />

      <SuspendUserDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        onConfirm={async () => {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            await fetch(`${apiBase}/admin/buyers/${actionBuyer?.id}/suspend`, {
              method: 'PATCH',
            });
          } catch (error) {
            console.error('Failed to suspend buyer:', error);
          }
          setSuspendOpen(false);
        }}
      />

      <ActivateUserDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        onConfirm={async () => {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            await fetch(`${apiBase}/admin/buyers/${actionBuyer?.id}/activate`, {
              method: 'PATCH',
            });
          } catch (error) {
            console.error('Failed to activate buyer:', error);
          }
          setActivateOpen(false);
        }}
      />
    </>
  );
}

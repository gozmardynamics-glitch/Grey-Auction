'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { useTranslations } from 'next-intl';
import { Buyer, BuyerDetail } from '../../models';
import { useBuyersColumns } from './buyers_column';
import BuyerDetailsModal from './buyer_details_modal';
import SuspendUserDialog from './suspend_user_dialog';
import ActivateUserDialog from './activate_user_dialog';
import { apiFetch } from '@/shared/utils/api-client';

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
  const t = useTranslations('admin.buyers.table');
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [actionBuyer, setActionBuyer] = useState<Buyer | null>(null);

  const columns = useBuyersColumns(
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
  );

  // Both routes are POST; the dialogs close first and report the outcome, so a
  // rejected call is visible instead of being swallowed by an empty catch.
  const setBuyerStatus = async (buyer: Buyer | null, action: 'suspend' | 'activate') => {
    if (!buyer) return;
    setSuspendOpen(false);
    setActivateOpen(false);
    try {
      await apiFetch(`admin/buyers/${encodeURIComponent(buyer.id)}/${action}`, {
        method: 'POST',
      });
      toast.success(`${buyer.name} ${action === 'suspend' ? 'suspended' : 'activated'}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${action} ${buyer.name}`,
      );
    }
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        tabFilters={tabFilters}
        title={title}
        emptyIcon={<Users className="h-10 w-10" />}
        emptyTitle={t('emptyTitle')}
        emptyDescription={t('emptyDescription')}
      />

      <BuyerDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        buyer={selectedBuyer}
      />

      <SuspendUserDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        onConfirm={() => setBuyerStatus(actionBuyer, 'suspend')}
      />

      <ActivateUserDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        onConfirm={() => setBuyerStatus(actionBuyer, 'activate')}
      />
    </>
  );
}

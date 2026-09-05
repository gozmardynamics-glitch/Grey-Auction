'use client';

import { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { useTranslations } from 'next-intl';
import { Seller } from '../../models';
import { useSellersColumns } from './sellers_column';
import SellerDetailsModal from './seller_details_modal';
import { type SellerDetail } from '../../models';
import SuspendSellerDialog from './suspend_seller_dialog';
import ActivateSellerDialog from './activate_seller_dialog';

interface SellersTableProps {
  data: Seller[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

export default function SellersTable({
  data,
  tabFilters,
  title,
}: SellersTableProps) {
  const t = useTranslations('admin.sellers.table');
  const [selectedSeller, setSelectedSeller] = useState<SellerDetail | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [actionSeller, setActionSeller] = useState<Seller | null>(null);

  const columns = useSellersColumns(
        (seller) => {
          const sellerDetail: SellerDetail = {
            ...seller,
          };
          setSelectedSeller(sellerDetail);
          setDetailsOpen(true);
        },
        (seller) => {
          setActionSeller(seller);
          setSuspendOpen(true);
        },
        (seller) => {
          setActionSeller(seller);
          setActivateOpen(true);
        }
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        tabFilters={tabFilters}
        title={title}
        emptyIcon={<UserPlus className="h-10 w-10" />}
        emptyTitle={t('emptyTitle')}
        emptyDescription={t('emptyDescription')}
      />

      <SellerDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        seller={selectedSeller}
      />

      <SuspendSellerDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        onConfirm={async () => {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            await fetch(`${apiBase}/sellers/${actionSeller?.id}/suspend`, {
              method: 'POST',
            });
          } catch (error) {
            console.error('Failed to suspend seller:', error);
          }
          setSuspendOpen(false);
        }}
      />

      <ActivateSellerDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        onConfirm={async () => {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            await fetch(`${apiBase}/sellers/${actionSeller?.id}/activate`, {
              method: 'POST',
            });
          } catch (error) {
            console.error('Failed to activate seller:', error);
          }
          setActivateOpen(false);
        }}
      />
    </>
  );
}

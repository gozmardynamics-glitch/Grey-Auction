'use client';

import { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { Seller } from '../../models';
import { Columns } from './sellers_column';
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
  const [selectedSeller, setSelectedSeller] = useState<SellerDetail | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [_actionSeller, setActionSeller] = useState<Seller | null>(null);

  const columns = useMemo(
    () =>
      Columns(
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
        emptyIcon={<UserPlus className="h-10 w-10" />}
        emptyTitle="No Sellers Available"
        emptyDescription="New sellers will appear here once they register on the platform."
      />

      <SellerDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        seller={selectedSeller}
      />

      <SuspendSellerDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        onConfirm={() => {
          setSuspendOpen(false);
        }}
      />

      <ActivateSellerDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        onConfirm={() => {
          setActivateOpen(false);
        }}
      />
    </>
  );
}

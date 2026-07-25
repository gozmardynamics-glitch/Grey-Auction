'use client';

import { useMemo, useState } from 'react';
import { ImageIcon } from 'lucide-react';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { Banner } from '../../models';
import { Columns } from './banners_column';
import BannerDetailsModal, { type BannerDetail } from './banner_details_modal';
import DeleteBannerDialog from './delete_banner_dialog';

interface BannersTableProps {
  data: Banner[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

export default function BannersTable({
  data,
  tabFilters,
  title,
}: BannersTableProps) {
  const [selectedBanner, setSelectedBanner] = useState<BannerDetail | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBanner, setDeleteBanner] = useState<Banner | null>(null);

  const columns = useMemo(
    () =>
      Columns(
        (banner) => {
          const bannerDetail: BannerDetail = {
            ...banner,
          };
          setSelectedBanner(bannerDetail);
          setDetailsOpen(true);
        },
        (banner) => {
          setDeleteBanner(banner);
          setDeleteOpen(true);
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
        emptyIcon={<ImageIcon className="h-10 w-10" />}
        emptyTitle="No Banners Available"
        emptyDescription="Add a new banner to display on the platform."
      />

      <BannerDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        banner={selectedBanner}
        onDelete={(banner) => {
          setDetailsOpen(false);
          setDeleteBanner(banner);
          setDeleteOpen(true);
        }}
        onSave={(banner) => {
          console.log('Save banner:', banner);
          setDetailsOpen(false);
        }}
      />

      <DeleteBannerDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          console.log('Delete banner:', deleteBanner);
          setDeleteOpen(false);
        }}
      />
    </>
  );
}

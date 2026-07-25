'use client';

import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';

import { DataTable, DeleteDialog, type TabFilter } from '@/shared/components/common';
import { Admin, AdminDetail } from '../../models';
import { Columns } from './admins_column';
import AdminDetailsModal from './admin_details_modal';

interface AdminsTableProps {
  data: Admin[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

export default function AdminsTable({
  data,
  tabFilters,
  title,
}: AdminsTableProps) {
  const [selectedAdmin, setSelectedAdmin] = useState<AdminDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAdmin, setDeleteAdmin] = useState<Admin | null>(null);

  const columns = useMemo(
    () =>
      Columns(
        (admin) => {
          const adminDetail: AdminDetail = {
            ...admin,
          };
          setSelectedAdmin(adminDetail);
          setDetailsOpen(true);
        },
        (admin) => {
          setDeleteAdmin(admin);
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
        emptyIcon={<Users className="h-10 w-10" />}
        emptyTitle="No Admins Available"
        emptyDescription="Add a new admin to manage the platform."
      />

      <AdminDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        admin={selectedAdmin}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          console.log('Delete admin:', deleteAdmin);
          setDeleteOpen(false);
        }}
        title="Delete User"
        description="Deleting this user will permanently remove it from the platform. You may want to disable the user if you plan to use it again later."
        confirmLabel="Yes, Delete User"
      />
    </>
  );
}

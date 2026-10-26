'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '@/shared/utils/api-client';
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

  const router = useRouter();

  const toggleStatus = useCallback(
    async (admin: Admin) => {
      const nextActive = admin.status === 'Suspended';
      try {
        await apiFetch(`admin/admins/${admin.id}`, {
          method: 'PATCH',
          body: { isActive: nextActive },
        });
        toast.success(nextActive ? 'Admin activated' : 'Admin suspended');
        router.refresh();
      } catch {
        toast.error('Could not update the admin');
      }
    },
    [router],
  );
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
        },
        toggleStatus
      ),
    [toggleStatus]
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
        onConfirm={async () => {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            await fetch(`${apiBase}/admin/admins/${deleteAdmin?.id}`, {
              method: 'DELETE',
            });
          } catch (error) {
            console.error('Failed to delete admin:', error);
          }
          setDeleteOpen(false);
        }}
        title="Delete User"
        description="Deleting this user will permanently remove it from the platform. You may want to disable the user if you plan to use it again later."
        confirmLabel="Yes, Delete User"
      />
    </>
  );
}

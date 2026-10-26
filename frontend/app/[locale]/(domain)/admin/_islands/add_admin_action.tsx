'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/common';
import { apiFetch, ApiError } from '@/shared/utils/api-client';
import { useAppSelector } from '@/redux/store';
import { type AdminRole } from '../models';

const AddAdminDialog = dynamic(() => import('../admins/components/add_admin_dialog'));

// The dialog shows product-facing role labels; the API stores AdminRole enum
// values, so translate before sending.
const API_ROLE: Record<AdminRole, string> = {
  'Super Admin': 'super_admin',
  Admin: 'platform_admin',
  Moderator: 'support_admin',
  Support: 'support_admin',
};

export default function AddAdminAction() {
  const router = useRouter();
  const authToken = useAppSelector((state) => state.auth.token);
  const [addAdminOpen, setAddAdminOpen] = useState(false);

  return (
    <>
      <Button className="gap-2" onClick={() => setAddAdminOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Admin
      </Button>
      <AddAdminDialog
        open={addAdminOpen}
        onOpenChange={setAddAdminOpen}
        onSubmit={async (data) => {
          try {
            await apiFetch('admin/admins', {
              method: 'POST',
              token: authToken,
              body: {
                email: data.email.trim(),
                password: data.password,
                name: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
                role: API_ROLE[data.role],
              },
            });
            toast.success('Admin created');
            router.refresh();
          } catch (error) {
            toast.error(
              error instanceof ApiError
                ? error.message
                : 'Could not create the admin',
            );
          }
        }}
      />
    </>
  );
}

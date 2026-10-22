'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/common';
import { useAppSelector } from '@/redux/store';
import { getErrorMessage } from '@/shared/utils/error_utils';

const AddAdminDialog = dynamic(() => import('../admins/components/add_admin_dialog'));

export default function AddAdminAction() {
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const token = useAppSelector((state) => state.auth.token);

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
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const res = await fetch(`${apiBase}/admin/admins`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ ...data, role: 'platform_admin' }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.message || 'Failed to create admin');
            }
            toast.success('Admin created');
            setAddAdminOpen(false);
          } catch (error) {
            toast.error(getErrorMessage(error) || 'Failed to add admin');
          }
        }}
      />
    </>
  );
}

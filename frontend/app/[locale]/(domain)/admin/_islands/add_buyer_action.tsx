'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/common';
import { apiFetch, ApiError } from '@/shared/utils/api-client';
import { useAppSelector } from '@/redux/store';

const AddUserDialog = dynamic(() => import('../buyers/components/add_user_dialog'));

export default function AddBuyerAction() {
  const router = useRouter();
  const authToken = useAppSelector((state) => state.auth.token);
  const [addUserOpen, setAddUserOpen] = useState(false);

  return (
    <>
      <Button className="" onClick={() => setAddUserOpen(true)}>
        <Plus className="h-4 w-4" />
        Add User
      </Button>
      <AddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onSubmit={async (data) => {
          try {
            await apiFetch('admin/users', {
              method: 'POST',
              token: authToken,
              body: {
                email: data.email.trim(),
                password: data.password,
                name: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
                role: 'bidder',
              },
            });
            toast.success('User created');
            router.refresh();
          } catch (error) {
            toast.error(
              error instanceof ApiError
                ? error.message
                : 'Could not create the user',
            );
          }
        }}
      />
    </>
  );
}

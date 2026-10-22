'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/common';
import { useAppSelector } from '@/redux/store';

const AddUserDialog = dynamic(() => import('../buyers/components/add_user_dialog'));

export default function AddBuyerAction() {
  const [addUserOpen, setAddUserOpen] = useState(false);
  const token = useAppSelector((state) => state.auth.token);

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
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const res = await fetch(`${apiBase}/admin/users`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ ...data, role: 'bidder' }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.message || 'Failed to create user');
            }
            toast.success('User created');
            setAddUserOpen(false);
          } catch (error: any) {
            toast.error(error?.message || 'Failed to add buyer');
          }
        }}
      />
    </>
  );
}

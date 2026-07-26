'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/common';

const AddUserDialog = dynamic(() => import('../buyers/components/add_user_dialog'));

export default function AddBuyerAction() {
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
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            await fetch(`${apiBase}/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, role: 'buyer' }),
            });
          } catch (error) {
            console.error('Failed to add buyer:', error);
          }
        }}
      />
    </>
  );
}

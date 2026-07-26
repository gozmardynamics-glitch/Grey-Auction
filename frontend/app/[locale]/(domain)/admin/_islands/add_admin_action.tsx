'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/common';

const AddAdminDialog = dynamic(() => import('../admins/components/add_admin_dialog'));

export default function AddAdminAction() {
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
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            await fetch(`${apiBase}/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, role: 'admin' }),
            });
          } catch (error) {
            console.error('Failed to add admin:', error);
          }
        }}
      />
    </>
  );
}

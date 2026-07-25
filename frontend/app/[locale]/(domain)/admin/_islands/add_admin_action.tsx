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
        onSubmit={(data) => {
          console.log('Add admin:', data);
        }}
      />
    </>
  );
}

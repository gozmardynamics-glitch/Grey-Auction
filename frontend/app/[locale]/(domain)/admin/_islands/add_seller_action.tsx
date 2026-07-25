'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/common';

const AddSellerDialog = dynamic(() => import('../sellers/components/add_seller_dialog'));

export default function AddSellerAction() {
  const [addSellerOpen, setAddSellerOpen] = useState(false);

  return (
    <>
      <Button className="" onClick={() => setAddSellerOpen(true)}>
        <Plus className="h-4 w-4" />
        Add User
      </Button>
      <AddSellerDialog
        open={addSellerOpen}
        onOpenChange={setAddSellerOpen}
        onSubmit={(data) => {
          console.log('Add seller:', data);
        }}
      />
    </>
  );
}

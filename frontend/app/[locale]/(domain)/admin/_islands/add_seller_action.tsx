'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/common';
import { apiFetch } from '@/shared/utils/api-client';
import { useAppSelector } from '@/redux/store';

const AddSellerDialog = dynamic(() => import('../sellers/components/add_seller_dialog'));

export default function AddSellerAction() {
  const authToken = useAppSelector((state) => state.auth.token);
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
        onSubmit={async (data) => {
          try {
            await apiFetch('sellers/register', {
              method: 'POST',
              token: authToken,
              body: data,
            });
          } catch (error) {
            console.error('Failed to add seller:', error);
          }
        }}
      />
    </>
  );
}

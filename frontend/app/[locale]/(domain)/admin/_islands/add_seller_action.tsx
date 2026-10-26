'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/common';
import { apiFetch, ApiError } from '@/shared/utils/api-client';
import { useAppSelector } from '@/redux/store';

const AddSellerDialog = dynamic(() => import('../sellers/components/add_seller_dialog'));

export default function AddSellerAction() {
  const router = useRouter();
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
            // POST sellers/register takes the full RegisterSellerDto; anything
            // extra is rejected by the global validation pipe.
            await apiFetch('sellers/register', {
              method: 'POST',
              token: authToken,
              body: data,
            });
            toast.success('Seller registered — awaiting verification');
            router.refresh();
          } catch (error) {
            toast.error(
              error instanceof ApiError
                ? error.message
                : 'Could not register the seller',
            );
          }
        }}
      />
    </>
  );
}

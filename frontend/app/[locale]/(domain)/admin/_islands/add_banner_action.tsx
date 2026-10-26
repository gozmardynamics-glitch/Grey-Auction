'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/common';
import { apiFetch } from '@/shared/utils/api-client';
import { useAppSelector } from '@/redux/store';

const AddBannerDialog = dynamic(() => import('../banners/components/add_banner_dialog'));

export default function AddBannerAction() {
  const authToken = useAppSelector((state) => state.auth.token);
  const [addBannerOpen, setAddBannerOpen] = useState(false);

  return (
    <>
      <Button className="gap-2" onClick={() => setAddBannerOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Banner
      </Button>
      <AddBannerDialog
        open={addBannerOpen}
        onOpenChange={setAddBannerOpen}
        onSubmit={async (data) => {
          try {
            await apiFetch('admin/banners', {
              method: 'POST',
              token: authToken,
              body: data,
            });
          } catch (error) {
            console.error('Failed to add banner:', error);
          }
        }}
      />
    </>
  );
}

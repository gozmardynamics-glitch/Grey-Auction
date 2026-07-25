'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/common';

const AddBannerDialog = dynamic(() => import('../banners/components/add_banner_dialog'));

export default function AddBannerAction() {
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
        onSubmit={(data) => {
          console.log('Add banner:', data);
        }}
      />
    </>
  );
}

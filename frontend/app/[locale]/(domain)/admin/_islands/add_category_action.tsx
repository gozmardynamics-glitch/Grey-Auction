'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/common';
import { Category } from '../models';
import { apiFetch } from '@/shared/utils/api-client';
import { useAppSelector } from '@/redux/store';

const AddCategoryDialog = dynamic(
  () => import('../categories/components/add_category_dialog')
);

interface AddCategoryActionProps {
  categories: Category[];
}

export default function AddCategoryAction({ categories }: AddCategoryActionProps) {
  const authToken = useAppSelector((state) => state.auth.token);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  return (
    <>
      <Button className="gap-2" onClick={() => setAddCategoryOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Category
      </Button>
      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        categories={categories}
        onSubmit={(data: Record<string, unknown>) => {
          apiFetch('categories', {
            method: 'POST',
            token: authToken,
            body: {
              name: data.name || data.category,
              slug: String(data.slug || data.name || data.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              description: data.description,
              subCategories: data.subCategories || [],
              imageUrl: data.icon || undefined,
            },
          }).catch(() => {});
        }}
      />
    </>
  );
}

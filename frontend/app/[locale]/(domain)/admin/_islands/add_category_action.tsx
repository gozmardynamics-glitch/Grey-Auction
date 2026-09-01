'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/common';
import { Category } from '../models';

const AddCategoryDialog = dynamic(
  () => import('../categories/components/add_category_dialog')
);

interface AddCategoryActionProps {
  categories: Category[];
}

export default function AddCategoryAction({ categories }: AddCategoryActionProps) {
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
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          fetch(`${apiBase}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.name || data.category,
              slug: String(data.slug || data.name || data.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              description: data.description,
              subCategories: data.subCategories || [],
              imageUrl: data.icon || undefined,
            }),
          }).catch(() => {});
        }}
      />
    </>
  );
}

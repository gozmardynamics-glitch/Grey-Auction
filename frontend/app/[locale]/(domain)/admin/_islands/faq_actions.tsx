'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/common';

const AddFaqDialog = dynamic(() => import('../faqs/components/add_faq_dialog'));
const AddCategoryDialog = dynamic(
  () => import('../faqs/components/add_category_dialog')
);

export default function FaqActions() {
  const [addFaqOpen, setAddFaqOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="bg-background"
        onClick={() => setAddCategoryOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Add Category
      </Button>
      <Button onClick={() => setAddFaqOpen(true)}>
        <Plus className="h-4 w-4" />
        Add FAQ
      </Button>
      <AddFaqDialog
        open={addFaqOpen}
        onOpenChange={setAddFaqOpen}
        onSubmit={(data) => {
          console.log('Add FAQ:', data);
        }}
      />
      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onSubmit={(data) => {
          console.log('Add category:', data);
        }}
      />
    </>
  );
}

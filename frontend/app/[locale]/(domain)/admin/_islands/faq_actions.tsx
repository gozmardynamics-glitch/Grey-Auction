'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/common';
import { apiFetch, ApiError } from '@/shared/utils/api-client';
import { useAppSelector } from '@/redux/store';

const AddFaqDialog = dynamic(() => import('../faqs/components/add_faq_dialog'));

export default function FaqActions() {
  const router = useRouter();
  const authToken = useAppSelector((state) => state.auth.token);
  const [addFaqOpen, setAddFaqOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setAddFaqOpen(true)}>
        <Plus className="h-4 w-4" />
        Add FAQ
      </Button>
      <AddFaqDialog
        open={addFaqOpen}
        onOpenChange={setAddFaqOpen}
        onSubmit={async (data) => {
          try {
            // CreateFaqDto: category, question, answer, order?, isActive?.
            // FAQ categories are derived from the FAQ rows themselves — there
            // is no category endpoint to post to.
            await apiFetch('admin/faqs', {
              method: 'POST',
              token: authToken,
              body: {
                category: data.category,
                question: data.question,
                answer: data.answer,
                isActive: data.isActive,
              },
            });
            toast.success('FAQ created');
            router.refresh();
          } catch (error) {
            toast.error(
              error instanceof ApiError
                ? error.message
                : 'Could not create the FAQ',
            );
          }
        }}
      />
    </>
  );
}

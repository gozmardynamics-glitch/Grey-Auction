'use client';

import { useMemo, useState } from 'react';
import { CircleHelp } from 'lucide-react';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { Faq } from '../../models';
import { Columns } from './faqs_column';
import FaqDetailsModal, { type FaqDetail } from './faq_details_modal';
import DeleteFaqDialog from './delete_faq_dialog';

interface FaqsTableProps {
  data: Faq[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

export default function FaqsTable({
  data,
  tabFilters,
  title,
}: FaqsTableProps) {
  const [selectedFaq, setSelectedFaq] = useState<FaqDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteFaq, setDeleteFaq] = useState<Faq | null>(null);

  const columns = useMemo(
    () =>
      Columns(
        (faq) => {
          const faqDetail: FaqDetail = {
            ...faq,
          };
          setSelectedFaq(faqDetail);
          setDetailsOpen(true);
        },
        (faq) => {
          setDeleteFaq(faq);
          setDeleteOpen(true);
        }
      ),
    []
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        tabFilters={tabFilters}
        title={title}
        emptyIcon={<CircleHelp className="h-10 w-10" />}
        emptyTitle="No FAQs Available"
        emptyDescription="Add a new FAQ to help users find answers quickly."
      />

      <FaqDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        faq={selectedFaq}
        onDelete={(faq) => {
          setDetailsOpen(false);
          setDeleteFaq(faq);
          setDeleteOpen(true);
        }}
        onSave={async (faq) => {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            await fetch(`${apiBase}/admin/faqs/${faq.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(faq),
            });
          } catch (error) {
            console.error('Failed to save FAQ:', error);
          }
          setDetailsOpen(false);
        }}
      />

      <DeleteFaqDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={async () => {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            await fetch(`${apiBase}/admin/faqs/${deleteFaq?.id}`, {
              method: 'DELETE',
            });
          } catch (error) {
            console.error('Failed to delete FAQ:', error);
          }
          setDeleteOpen(false);
        }}
      />
    </>
  );
}

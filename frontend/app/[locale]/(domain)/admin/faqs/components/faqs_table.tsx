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
        onSave={(faq) => {
          console.log('Save FAQ:', faq);
          setDetailsOpen(false);
        }}
      />

      <DeleteFaqDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          console.log('Delete FAQ:', deleteFaq);
          setDeleteOpen(false);
        }}
      />
    </>
  );
}

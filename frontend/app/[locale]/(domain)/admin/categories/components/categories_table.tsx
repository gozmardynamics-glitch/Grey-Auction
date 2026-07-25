'use client';

import { useMemo, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import dynamic from 'next/dynamic';

import { DataTable, type TabFilter } from '@/shared/components/common';
import { Category, CategoryDetail } from '../../models';
import { Columns } from './categories_column';

const CategoryDetailsModal = dynamic(() => import('./category_details_modal'));
const DeleteCategoryDialog = dynamic(() => import('./delete_category_dialog'));

interface CategoriesTableProps {
  data: Category[];
  tabFilters?: readonly TabFilter[];
  title?: string;
}

export default function CategoriesTable({
  data,
  tabFilters,
  title,
}: CategoriesTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const columns = useMemo(
    () =>
      Columns(
        (category) => {
          const categoryDetail: CategoryDetail = {
            ...category,
          };
          setSelectedCategory(categoryDetail);
          setDetailsOpen(true);
        },
        (category) => {
          setDeleteCategory(category);
          setDeleteOpen(true);
        },
        (category) => {
          console.log('Toggle status:', category.id, category.status === 'Active' ? 'Inactive' : 'Active');
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
        pageSize={8}
        emptyIcon={<LayoutGrid className="h-10 w-10" />}
        emptyTitle="No Categories Available"
        emptyDescription="Add a new category to organize your listings."
      />

      {/* Category Details / Edit Modal */}
      <CategoryDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        category={selectedCategory}
        onDelete={(category) => {
          setDetailsOpen(false);
          setDeleteCategory(category);
          setDeleteOpen(true);
        }}
        onSave={(category) => {
          console.log('Save category:', category);
          setDetailsOpen(false);
        }}
      />

      {/* Delete Category Dialog */}
      <DeleteCategoryDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          console.log('Delete category:', deleteCategory?.id);
          setDeleteOpen(false);
        }}
      />
    </>
  );
}

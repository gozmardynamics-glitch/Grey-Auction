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
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          fetch(`${apiBase}/categories/${category.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isActive: category.status === 'Active' ? false : true,
            }),
          }).catch(() => {});
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
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          fetch(`${apiBase}/categories/${category.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: (category as { category?: string; name?: string }).category || (category as { category?: string; name?: string }).name,
              description: (category as { description?: string }).description,
            }),
          }).catch(() => {});
          setDetailsOpen(false);
        }}
      />

      {/* Delete Category Dialog */}
      <DeleteCategoryDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          if (deleteCategory) {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            fetch(`${apiBase}/categories/${deleteCategory.id}`, {
              method: 'DELETE',
            }).catch(() => {});
          }
          setDeleteOpen(false);
        }}
      />
    </>
  );
}

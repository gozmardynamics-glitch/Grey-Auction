import CategoriesTable from './components/categories_table';
import AddCategoryAction from '../_islands/add_category_action';
import { getAdminCategories } from '@/lib/server/data';

const TAB_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

export default async function Categories() {
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <AddCategoryAction categories={categories} />
      </div>

      <CategoriesTable data={categories} tabFilters={TAB_FILTERS} />
    </div>
  );
}

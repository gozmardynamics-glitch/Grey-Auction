import AdminsTable from './components/admins_table';
import { ADMIN_TAB_FILTERS } from '../models/data';
import AddAdminAction from '../_islands/add_admin_action';
import { getAdminAdmins } from '@/lib/server/data';

export default async function Admins() {
  const admins = await getAdminAdmins();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">User Roles</h1>
        <AddAdminAction />
      </div>

      <AdminsTable data={admins} tabFilters={ADMIN_TAB_FILTERS} />
    </div>
  );
}

import { UsersTable } from './users-table';
import { getAdminUsers } from '../../actions/admin';
import { ShieldAlert } from 'lucide-react';

export default async function UsersPage() {
  const { data: users, error } = await getAdminUsers();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
      </div>

      <div
        className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4"
        role="alert"
      >
        <p className="font-bold">Danger Zone</p>
        <p>
          Promoting a user to SUPER_ADMIN grants them full access to this panel.
        </p>
      </div>

      {error ? (
        <div className="text-red-500">Failed to load users: {error}</div>
      ) : (
        <UsersTable initialUsers={users || []} />
      )}
    </div>
  );
}

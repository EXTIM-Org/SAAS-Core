import { UsersTable } from './users-table';
import { getAdminUsers } from '../../actions/admin';
import { ShieldAlert } from 'lucide-react';

import { cookies } from 'next/headers';

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default async function UsersPage() {
  const { data: users, error } = await getAdminUsers();
  
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  let currentUserId = '';
  if (token) {
    const payload = decodeJwt(token);
    if (payload && payload.userId) {
      currentUserId = payload.userId;
    } else if (payload && payload.sub) {
      currentUserId = payload.sub;
    }
  }

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
          Promoting a user to SUPPORT, ADMIN or SUPER_ADMIN grants them access to this panel (Support has read-only access).
        </p>
      </div>

      {error ? (
        <div className="text-red-500">Failed to load users: {error}</div>
      ) : (
        <UsersTable initialUsers={users || []} currentUserId={currentUserId} />
      )}
    </div>
  );
}

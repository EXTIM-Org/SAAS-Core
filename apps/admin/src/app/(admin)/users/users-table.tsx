'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { updateUserRole } from '../../actions/admin';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export function UsersTable({ initialUsers, currentUserId }: { initialUsers: User[], currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }
    try {
      const res = await updateUserRole(userId, newRole);
      if (res.error) throw new Error(res.error);

      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update role');
      console.error(error);
    }
  };

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Joined At</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={user.id === currentUserId}
                  className="w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="USER">User</option>
                  <option value="SUPPORT">Support</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

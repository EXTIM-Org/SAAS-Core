'use server';

import { cookies } from 'next/headers';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:4000';

export interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalOrders: number;
  totalRevenue: number;
}

export async function getAdminStatsAction(): Promise<AdminStats | null> {
  const token = (await cookies()).get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/admin/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const stats = await response.json();
    return stats;
  } catch (error) {
    console.error('Failed to fetch admin stats', error);
    return null;
  }
}

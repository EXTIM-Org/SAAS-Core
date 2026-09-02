'use server';

import { cookies } from 'next/headers';
import { fetchWithAuth } from './fetch-api';
import { redirect } from 'next/navigation';

export async function impersonateUserAction(userId: string, projectId: string) {
  const cookieStore = await cookies();
  const currentToken = cookieStore.get('token')?.value;

  if (!currentToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetchWithAuth(`/auth/impersonate/${userId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to impersonate user: API error');
  }

  const data = await response.json();

  if (!data.accessToken) {
    throw new Error('Failed to impersonate user: No token');
  }

  // Backup the admin token
  cookieStore.set('admin_token', currentToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Set the new impersonation token
  cookieStore.set('token', data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001';
  redirect(`${dashboardUrl}/dashboard/projects/${projectId}`);
}

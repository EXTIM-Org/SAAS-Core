'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function stopImpersonationAction() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;

  if (adminToken) {
    // Restore the admin token to the main token cookie
    cookieStore.set('token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    // Delete the backup admin token
    cookieStore.delete('admin_token');
  } else {
    // Fallback if admin_token is missing, just clear the current token
    cookieStore.delete('token');
  }

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002';
  redirect(adminUrl);
}

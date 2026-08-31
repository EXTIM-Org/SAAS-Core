'use server';

import { cookies } from 'next/headers';
import { UserPayload } from '@saas/shared';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:4000';

export async function getCurrentUserAction(): Promise<
  (UserPayload & { email: string }) | null
> {
  const token = (await cookies()).get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
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

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Failed to fetch current user', error);
    return null;
  }
}

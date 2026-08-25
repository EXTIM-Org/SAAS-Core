'use server';

import { cookies } from 'next/headers';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:4000';

async function getAuthHeaders() {
  const token = (await cookies()).get('token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function processCheckoutAction(projectId: string) {
  const response = await fetch(`${API_URL}/checkout/process`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ projectId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || 'Failed to process checkout' };
  }

  return { success: true, data: await response.json() };
}

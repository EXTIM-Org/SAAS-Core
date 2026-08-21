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

export async function getDomains(projectId: string) {
  const response = await fetch(`${API_URL}/domains?projectId=${projectId}`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch domains');
  }

  return response.json();
}

export async function createDomainAction(data: {
  name: string;
  projectId: string;
}) {
  const response = await fetch(`${API_URL}/domains`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || 'Failed to create domain' };
  }

  return { success: true, data: await response.json() };
}

export async function deleteDomainAction(id: string) {
  const response = await fetch(`${API_URL}/domains/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || 'Failed to delete domain' };
  }

  return { success: true };
}

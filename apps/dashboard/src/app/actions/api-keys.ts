'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:4000';

export async function getApiKeysAction(projectId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const response = await fetch(`${API_URL}/projects/${projectId}/api-keys`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { error: 'Failed to fetch API keys' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
}

export async function createApiKeyAction(projectId: string, name: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const response = await fetch(`${API_URL}/projects/${projectId}/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      return { error: 'Failed to create API key' };
    }

    const data = await response.json();
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, data };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
}

export async function deleteApiKeyAction(projectId: string, keyId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const response = await fetch(
      `${API_URL}/projects/${projectId}/api-keys/${keyId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return { error: 'Failed to delete API key' };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
}

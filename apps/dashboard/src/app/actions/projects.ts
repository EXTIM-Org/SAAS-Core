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

export async function getProjects() {
  const response = await fetch(`${API_URL}/projects`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  return response.json();
}

export async function getProject(id: string) {
  const response = await fetch(`${API_URL}/projects/${id}`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch project');
  }

  return response.json();
}

export async function createProjectAction(data: { name: string }) {
  const response = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || 'Failed to create project' };
  }

  return { success: true, data: await response.json() };
}

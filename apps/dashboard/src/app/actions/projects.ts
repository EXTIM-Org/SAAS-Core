'use server';

import { fetchWithAuth } from './fetch-api';

export async function getProjects() {
  const response = await fetchWithAuth('/projects');

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  return response.json();
}

export async function getProject(id: string) {
  const response = await fetchWithAuth(`/projects/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch project');
  }

  return response.json();
}

export async function createProjectAction(data: { name: string }) {
  const response = await fetchWithAuth(`/projects`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || 'Failed to create project' };
  }

  return { success: true, data: await response.json() };
}

'use server';

import { fetchWithAuth } from './fetch-api';

export type ProjectRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

export async function getProjectMembers(projectId: string) {
  const response = await fetchWithAuth(`/projects/${projectId}/members`);

  if (!response.ok) {
    throw new Error('Failed to fetch project members');
  }

  return response.json();
}

export async function addProjectMember(
  projectId: string,
  email: string,
  role: ProjectRole,
) {
  const response = await fetchWithAuth(`/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || 'Failed to add member' };
  }

  return { success: true, data: await response.json() };
}

export async function updateProjectMemberRole(
  projectId: string,
  memberId: string,
  role: ProjectRole,
) {
  const response = await fetchWithAuth(
    `/projects/${projectId}/members/${memberId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || 'Failed to update member role' };
  }

  return { success: true, data: await response.json() };
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const response = await fetchWithAuth(
    `/projects/${projectId}/members/${memberId}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || 'Failed to remove member' };
  }

  return { success: true, data: await response.json() };
}

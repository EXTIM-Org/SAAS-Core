'use server';

import { fetchWithAuth } from './fetch-api';
import { revalidatePath } from 'next/cache';

export async function getAdminStats() {
  try {
    const res = await fetchWithAuth('/admin/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return { data: await res.json() };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getAdminUsers() {
  try {
    const res = await fetchWithAuth('/admin/users');
    if (!res.ok) {
      const text = await res.text();
      console.error('getAdminUsers error:', res.status, text);
      throw new Error(`Failed to fetch users: ${res.status} ${text}`);
    }
    return { data: await res.json() };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateUserRole(userId: string, role: string) {
  try {
    const res = await fetchWithAuth(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });

    if (!res.ok) throw new Error('Failed to update role');
    revalidatePath('/users');
    return { data: await res.json() };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getSystemSettings() {
  try {
    const res = await fetchWithAuth('/admin/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return { data: await res.json() };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSystemSettings(
  defaultAutoCrawlIntervalDays: number,
) {
  try {
    const res = await fetchWithAuth('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ defaultAutoCrawlIntervalDays }),
    });

    if (!res.ok) throw new Error('Failed to update settings');
    revalidatePath('/settings');
    return { data: await res.json() };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getAdminProjects() {
  try {
    const res = await fetchWithAuth('/admin/projects', {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return { data: await res.json() };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateProjectInterval(
  projectId: string,
  autoCrawlIntervalDays: number | null,
) {
  try {
    const res = await fetchWithAuth(`/admin/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ autoCrawlIntervalDays }),
    });

    if (!res.ok) throw new Error('Failed to update project');
    revalidatePath('/projects');
    return { data: await res.json() };
  } catch (error: any) {
    return { error: error.message };
  }
}

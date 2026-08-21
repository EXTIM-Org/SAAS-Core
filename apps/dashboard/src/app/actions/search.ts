'use server';

import { cookies } from 'next/headers';

const SEARCH_API_URL =
  process.env.NEXT_PUBLIC_SEARCH_API_URL || 'http://localhost:4001';

async function getAuthHeaders() {
  const token = (await cookies()).get('token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function searchProjectAction(projectId: string, query: string) {
  if (!query.trim()) {
    return { data: [] };
  }

  const url = new URL(`${SEARCH_API_URL}/search/${projectId}`);
  url.searchParams.append('q', query);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || 'Failed to perform search' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'An error occurred during search' };
  }
}

export async function crawlUrlAction(
  projectId: string,
  url: string,
  domain: string
) {
  if (!url.trim() || !domain.trim()) {
    return { error: 'URL and domain are required' };
  }

  const apiUrl = new URL(`${SEARCH_API_URL}/search/crawl/${projectId}`);

  try {
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ url, domain }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || 'Failed to submit URL for indexing' };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'An error occurred during submission' };
  }
}

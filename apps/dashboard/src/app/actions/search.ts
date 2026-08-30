'use server';

import { fetchWithAuth } from './fetch-api';

const SEARCH_API_URL =
  process.env.NEXT_PUBLIC_SEARCH_API_URL || 'http://localhost:4001';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:4000';

export async function searchProjectAction(projectId: string, query: string) {
  if (!query.trim()) {
    return { data: [] };
  }

  const url = new URL(`${SEARCH_API_URL}/search/${projectId}`);
  url.searchParams.append('q', query);

  try {
    const response = await fetchWithAuth(url.toString(), {
      method: 'GET',
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
    const response = await fetchWithAuth(apiUrl.toString(), {
      method: 'POST',
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

export async function getProjectDocumentsAction(projectId: string, page: number = 1) {
  const url = new URL(`${SEARCH_API_URL}/search/${projectId}/documents`);
  url.searchParams.append('page', page.toString());
  
  try {
    const response = await fetchWithAuth(url.toString(), {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || 'Failed to fetch documents' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'An error occurred' };
  }
}

export async function deleteProjectDocumentAction(projectId: string, documentId: string) {
  const url = new URL(`${SEARCH_API_URL}/search/${projectId}/documents/${documentId}`);
  
  try {
    const response = await fetchWithAuth(url.toString(), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || 'Failed to delete document' };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'An error occurred' };
  }
}

export async function deleteAllProjectDocumentsAction(projectId: string) {
  const url = new URL(`${SEARCH_API_URL}/search/${projectId}/documents`);
  
  try {
    const response = await fetchWithAuth(url.toString(), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || 'Failed to delete all documents' };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'An error occurred' };
  }
}

export async function clearProjectQueueAction(projectId: string) {
  const url = new URL(`${SEARCH_API_URL}/search/${projectId}/queue`);
  
  try {
    const response = await fetchWithAuth(url.toString(), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || 'Failed to clear queue' };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'An error occurred' };
  }
}

export async function getProjectAnalyticsAction(projectId: string) {
  const url = new URL(`${SEARCH_API_URL}/search/${projectId}/analytics`);
  
  try {
    const response = await fetchWithAuth(url.toString(), {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || 'Failed to fetch analytics' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    const err = error as Error;
    return { error: err.message || 'An error occurred' };
  }
}

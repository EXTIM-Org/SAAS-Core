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

export async function getProductsAction(projectId: string) {
  const response = await fetch(`${API_URL}/products?projectId=${projectId}`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

export async function getProductAction(id: string) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }

  return response.json();
}

export async function createProductAction(
  projectId: string,
  data: {
    name: string;
    description?: string;
    price: number;
    inventoryCount: number;
    categoryId?: string;
  }
) {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ ...data, projectId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || 'Failed to create product' };
  }

  return { success: true, data: await response.json() };
}

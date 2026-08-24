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

export async function getCartAction(projectId: string) {
  const response = await fetch(`${API_URL}/projects/${projectId}/cart`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cart');
  }

  return response.json();
}

export async function addToCartAction(
  projectId: string,
  productId: string,
  quantity: number = 1
) {
  const response = await fetch(`${API_URL}/projects/${projectId}/cart/items`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ productId, quantity }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || 'Failed to add item to cart' };
  }

  return { success: true, data: await response.json() };
}

export async function updateCartItemAction(
  projectId: string,
  itemId: string,
  quantity: number
) {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/cart/items/${itemId}`,
    {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ quantity }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || 'Failed to update item quantity' };
  }

  return { success: true, data: await response.json() };
}

export async function removeCartItemAction(projectId: string, itemId: string) {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/cart/items/${itemId}`,
    {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.message || 'Failed to remove item from cart' };
  }

  return { success: true, data: await response.json() };
}

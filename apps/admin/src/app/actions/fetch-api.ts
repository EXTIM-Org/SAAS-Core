'use server';

import { cookies } from 'next/headers';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:4000';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  let token = cookieStore.get('token')?.value;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh the token
  if (response.status === 401) {
    const refreshToken = cookieStore.get('refreshToken')?.value;
    
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const result = await refreshRes.json();
          const newToken = result.accessToken || result.access_token;
          
          if (newToken) {
            token = newToken;
            
            try {
              // Update cookies
              cookieStore.set('token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60, // 7 days
                path: '/',
              });
              
              if (result.refreshToken) {
                cookieStore.set('refreshToken', result.refreshToken, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  maxAge: 30 * 24 * 60 * 60, // 30 days
                  path: '/',
                });
              }
            } catch (cookieError) {
              console.warn('Could not update cookies during SSR. Tokens will not be persisted in this request.');
            }

            // Retry original request with new token
            headers.set('Authorization', `Bearer ${token}`);
            response = await fetch(url, {
              ...options,
              headers,
            });
          }
        }
      } catch (err) {
        console.error('Failed to refresh token:', err);
      }
    }
  }

  return response;
}

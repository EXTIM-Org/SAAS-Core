'use server';

import { cookies } from 'next/headers';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:4000';

export async function loginAction(data: { email: string; password: string }) {
  console.log('--- loginAction CALLED ---');
  console.log(`Fetching from API_URL: ${API_URL}/auth/login`);
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    console.log(
      `loginAction Response status: ${response.status} ${response.statusText}`,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('loginAction Error Data:', errorData);
      return { error: errorData.message || 'Failed to login' };
    }

    const result = await response.json();
    console.log(
      'loginAction Success token length:',
      result.accessToken?.length,
    );
    const token = result.accessToken || result.access_token;
    if (token) {
      (await cookies()).set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
    }

    if (result.refreshToken) {
      (await cookies()).set('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    }
    return { success: true };
  } catch (err: any) {
    console.error('loginAction FETCH THREW AN ERROR:', err);
    return { error: err.message || 'Network error' };
  }
}

export async function signupAction(data: { email: string; password: string }) {
  console.log('--- signupAction CALLED ---');
  console.log(`Fetching from API_URL: ${API_URL}/auth/signup`);
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    console.log(
      `signupAction Response status: ${response.status} ${response.statusText}`,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('signupAction Error Data:', errorData);
      return { error: errorData.message || 'Failed to sign up' };
    }

    const result = await response.json();
    console.log(
      'signupAction Success token length:',
      result.accessToken?.length,
    );
    const token = result.accessToken || result.access_token;
    if (token) {
      (await cookies()).set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
    }

    if (result.refreshToken) {
      (await cookies()).set('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    }
    return { success: true };
  } catch (err: any) {
    console.error('signupAction FETCH THREW AN ERROR:', err);
    return { error: err.message || 'Network error' };
  }
}

export async function logoutAction() {
  const token = (await cookies()).get('token')?.value;

  if (token) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Failed to call logout API:', err);
    }
  }

  (await cookies()).delete('token');
  (await cookies()).delete('refreshToken');
  return { success: true };
}

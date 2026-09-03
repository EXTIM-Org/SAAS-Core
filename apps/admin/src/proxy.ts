import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // We consider all routes except /login to be protected admin routes
  const isPublicRoute = pathname === '/login';

  if (!isPublicRoute) {
    const adminToken = request.cookies.get('admin_token')?.value;

    if (!token && !adminToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    let payload = token ? decodeJwt(token) : null;

    // If current token is missing or not admin, but we have admin_token, restore it
    if ((!payload || payload.role !== 'SUPER_ADMIN') && adminToken) {
      const adminPayload = decodeJwt(adminToken);
      if (adminPayload && adminPayload.role === 'SUPER_ADMIN') {
        const response = NextResponse.redirect(request.url);
        response.cookies.set('token', adminToken);
        response.cookies.delete('admin_token');
        return response;
      }
    }

    if (!payload || payload.role !== 'SUPER_ADMIN') {
      // If they are logged in but not an admin, redirect them to the main app dashboard
      // or just redirect to login with an error. We'll clear the token and redirect to login.
      const response = NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url),
      );
      response.cookies.delete('token');
      response.cookies.delete('admin_token');
      return response;
    }
  }

  // Auth routes (redirect to admin root if already authenticated as admin)
  if (isPublicRoute) {
    if (token) {
      const payload = decodeJwt(token);
      if (payload && payload.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
};

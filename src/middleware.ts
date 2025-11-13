import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/crm',
  '/orders',
  '/tasks',
  '/products',
  '/accounting',
  '/reports',
  '/settings',
];

// Define superadmin routes that require super_admin role
const superadminRoutes = [
  '/superadmin',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/',
];

// Decode JWT token to get user role (client-side only, no verification)
function decodeJWT(token: string): { systemRole?: string; role?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

// Get user role from token (check both systemRole and role for compatibility)
function getUserRole(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.systemRole || payload?.role || null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Try to get token from cookies or authorization header
  const accessToken = request.cookies.get('accessToken')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '');

  // Get user role if token exists
  const userRole = accessToken ? getUserRole(accessToken) : null;

  // Check if the current path is a superadmin route
  const isSuperadminRoute = superadminRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // Protect superadmin routes - only super_admin can access
  if (isSuperadminRoute) {
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    if (userRole !== 'super_admin') {
      // Redirect non-superadmin users to their dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Allow authenticated users to access home page (no forced redirect)
  // The home page will show a "Go to Dashboard" button if authenticated

  // If superadmin is trying to access regular dashboard, redirect to superadmin dashboard
  if (accessToken && userRole === 'super_admin' && pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
  }

  // If it's a protected route and user is not authenticated
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access auth pages, redirect based on role
  if (accessToken && (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password')) {
    // Redirect super_admin to superadmin dashboard, others to regular dashboard
    const redirectPath = userRole === 'super_admin' ? '/superadmin/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Build CSP connect-src directive dynamically based on API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  let connectSrc = "'self'";
  
  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      // Extract origin (protocol + hostname + port if present)
      connectSrc += ` ${url.origin}`;
    } catch (e) {
      // If URL parsing fails, log error but don't add invalid URL
      console.error('Invalid NEXT_PUBLIC_API_URL:', apiUrl);
    }
  }
  
  // In development, also allow localhost connections
  if (process.env.NODE_ENV === 'development') {
    connectSrc += " http://localhost:* ws://localhost:* ws://127.0.0.1:*";
  }
  
  // Only add CSP in production, not in development
  // In development, CSP blocks localhost connections
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set(
      'Content-Security-Policy',
      `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src ${connectSrc};`
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
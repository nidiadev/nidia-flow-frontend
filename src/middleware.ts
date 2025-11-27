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
function decodeJWT(token: string): { systemRole?: string; role?: string; tenantSlug?: string; tenantId?: string } | null {
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

// Get tenant slug from token
function getTenantSlug(token: string): string | null {
  const payload = decodeJWT(token);
  return payload?.tenantSlug || null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Early return para recursos estáticos y rutas que no necesitan procesamiento
  // Esto previene ejecuciones innecesarias del middleware y bucles infinitos
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/site.webmanifest') ||
    pathname.startsWith('/.well-known/') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js|json|map|txt|xml)$/i)
  ) {
    return NextResponse.next();
  }
  
  // CRÍTICO: Verificar si esta es una request de Next.js interno (RSC, etc.)
  // Estas requests pueden causar bucles infinitos si las interceptamos
  const isNextInternal = pathname.startsWith('/_next') || 
                         request.headers.get('x-middleware-rewrite') ||
                         request.headers.get('x-middleware-subrequest') ||
                         request.headers.get('rsc') === '1' ||
                         request.headers.get('next-router-prefetch') === '1';
  
  if (isNextInternal) {
    return NextResponse.next();
  }
  
  // Try to get token from cookies first (middleware can access cookies)
  const accessToken = request.cookies.get('accessToken')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '');

  // Get user role if token exists
  const userRole = accessToken ? getUserRole(accessToken) : null;
  
  // IMPORTANTE: tenantSlug solo se usa para tenants, NO para superadmin
  // Superadmin no tiene tenantSlug y no lo necesita
  const isSuperAdmin = userRole === 'super_admin';
  const tenantSlug = accessToken && !isSuperAdmin ? getTenantSlug(accessToken) : null;
  
  // Debug logging for superadmin routes (solo una vez por request, no en cada ejecución)
  // Comentado para evitar spam - descomentar solo cuando necesites debug
  // if (pathname.startsWith('/superadmin') && process.env.NODE_ENV === 'development') {
  //   const payload = accessToken ? decodeJWT(accessToken) : null;
  //   console.log('[Middleware Debug]', {
  //     pathname,
  //     hasToken: !!accessToken,
  //     userRole,
  //     tenantSlug,
  //   });
  // }

  // Check if the current path is a superadmin route (debe estar antes de usarse)
  const isSuperadminRoute = superadminRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if path matches tenant slug pattern: /[slug]/dashboard, /[slug]/crm, etc.
  const slugPattern = /^\/([^\/]+)\/(dashboard|crm|orders|tasks|products|accounting|reports|settings)/;
  const slugMatch = pathname.match(slugPattern);
  const urlSlug = slugMatch ? slugMatch[1] : null;

  // Validate tenant slug in URL against JWT
  // IMPORTANTE: Solo validar si NO estamos en una ruta de superadmin para evitar bucles
  if (urlSlug && accessToken && !isSuperadminRoute) {
    if (userRole === 'super_admin') {
      // Superadmin no debe acceder a rutas con slug de tenant
      // Solo redirigir si no estamos ya en /superadmin/dashboard
      if (pathname !== '/superadmin/dashboard') {
        return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
      }
    }
    
    if (tenantSlug && urlSlug !== tenantSlug) {
      // El slug en la URL no coincide con el del JWT, redirigir al correcto
      const correctPath = pathname.replace(`/${urlSlug}/`, `/${tenantSlug}/`);
      return NextResponse.redirect(new URL(correctPath, request.url));
    }
    
    if (!tenantSlug && userRole !== 'super_admin') {
      // Usuario de tenant sin slug en JWT, redirigir a dashboard sin slug (fallback)
      const fallbackPath = pathname.replace(`/${urlSlug}/`, '/');
      return NextResponse.redirect(new URL(fallbackPath, request.url));
    }
  }

  // Check if the current path is protected (including tenant slug routes)
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  ) || slugMatch !== null;

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // Protect superadmin routes - only super_admin can access
  if (isSuperadminRoute) {
    // Si no hay token, redirigir al login
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Si hay token pero no se puede decodificar el rol, el token es inválido
    // Redirigir al login para re-autenticar (esto previene bucles infinitos)
    if (!userRole) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('expired', 'true');
      return NextResponse.redirect(loginUrl);
    }
    
    // Si el usuario es super_admin, permitir acceso inmediatamente
    // CRÍTICO: Retornar inmediatamente sin procesar más lógica para evitar bucles
    // NO continuar con el resto del middleware para rutas de superadmin
    if (userRole === 'super_admin') {
      // Retornar NextResponse.next() sin modificaciones ni headers adicionales
      // Esto evita que el middleware se ejecute múltiples veces o procese más lógica
      return NextResponse.next();
    }
    
    // Si no es super_admin y tiene un rol definido, redirigir a su dashboard
    if (userRole !== 'super_admin') {
      const redirectPath = tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    
    // Si llegamos aquí, hay token pero userRole es null/undefined (ya manejado arriba)
    // Por seguridad, redirigir al login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('expired', 'true');
    return NextResponse.redirect(loginUrl);
  }

  // Allow authenticated users to access home page (no forced redirect)
  // The home page will show a "Go to Dashboard" button if authenticated

  // If superadmin is trying to access regular dashboard, redirect to superadmin dashboard
  // IMPORTANTE: Solo redirigir si NO está ya en una ruta de superadmin para evitar ciclos infinitos
  // También verificar que no estemos ya en /superadmin/dashboard para evitar bucles
  if (
    accessToken && 
    userRole === 'super_admin' && 
    !isSuperadminRoute && 
    pathname !== '/superadmin/dashboard' && // Evitar redirigir si ya estamos en el dashboard
    (pathname === '/dashboard' || slugMatch)
  ) {
    return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
  }

  // If it's a protected route and user is not authenticated
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access auth pages, redirect based on role
  // IMPORTANTE: Verificar que no estemos ya en la ruta de destino para evitar bucles
  if (accessToken && (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password')) {
    // Redirect super_admin to superadmin dashboard, others to tenant dashboard with slug
    const redirectPath = userRole === 'super_admin' 
      ? '/superadmin/dashboard' 
      : (tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard');
    
    // Solo redirigir si no estamos ya en la ruta de destino
    if (pathname !== redirectPath) {
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  // Redirect old /dashboard routes to /[slug]/dashboard if user has tenantSlug
  if (accessToken && pathname === '/dashboard' && tenantSlug && userRole !== 'super_admin') {
    return NextResponse.redirect(new URL(`/${tenantSlug}/dashboard`, request.url));
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
      // Also allow WebSocket protocols for the same origin
      if (url.protocol === 'https:') {
        // In production (https), allow both wss:// and ws:// (fallback)
        connectSrc += ` wss://${url.host} ws://${url.host}`;
      } else if (url.protocol === 'http:') {
        connectSrc += ` ws://${url.host}`;
      }
    } catch (e) {
      // If URL parsing fails, log error but don't add invalid URL
      console.error('Invalid NEXT_PUBLIC_API_URL:', apiUrl);
    }
  }
  
  // Allow Google Apps Script for waitlist form submissions
  // Note: CSP doesn't support wildcards in the middle of domains, so we list specific domains
  connectSrc += " https://script.google.com https://script.googleusercontent.com";
  
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
     * - _next (Next.js internal routes - static, image, webpack-hmr, RSC, etc.)
     * - favicon.ico (favicon file)
     * - site.webmanifest (manifest file)
     * - .well-known (well-known paths)
     * - static assets (images, fonts, etc.)
     * 
     * IMPORTANTE: El matcher debe ser específico para evitar interceptar
     * requests internos de Next.js que causan bucles infinitos.
     * 
     * Solo interceptar rutas de páginas reales, no recursos estáticos
     * ni requests internos de Next.js (RSC, prefetch, etc.)
     */
    /*
     * Match only page routes, exclude:
     * - API routes (/api)
     * - Next.js internals (/_next) - incluye RSC, prefetch, etc.
     * - Static files (favicon, manifest, etc.)
     * - File extensions (images, fonts, etc.)
     * 
     * CRÍTICO: Excluir explícitamente _next para evitar bucles con RSC
     */
    '/((?!api|_next|favicon|site\\.webmanifest|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js|json|map|txt|xml)$).*)',
  ],
};
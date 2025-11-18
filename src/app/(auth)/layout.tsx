'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthService } from '@/lib/auth';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const userRole = user?.systemRole || user?.role;
      const isSuperAdmin = userRole === 'super_admin';
      
      // IMPORTANTE: tenantSlug solo se usa para tenants, NO para superadmin
      if (isSuperAdmin) {
        router.push('/superadmin/dashboard');
      } else {
        // Solo obtener tenantSlug para usuarios de tenant
        const tenantSlug = AuthService.getTenantSlug();
        if (tenantSlug) {
          router.push(`/${tenantSlug}/dashboard`);
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  // Don't render auth pages if user is already authenticated
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
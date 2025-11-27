'use client';

import { useAuth } from '@/contexts/auth-context';
import { MainLayout } from '@/components/layout/main-layout';
import { AppLoading } from '@/components/ui/app-loading';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthService } from '@/lib/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si el usuario es superadmin, redirigir al panel de administración
    // Priorizar systemRole sobre role
    const userRole = user?.systemRole || user?.role;
    if (!isLoading && isAuthenticated && userRole === 'super_admin') {
      // Solo redirigir si no estamos ya en una ruta de superadmin
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/superadmin')) {
        console.log('🔄 Usuario superadmin detectado en layout de dashboard, redirigiendo a /superadmin/dashboard');
        window.location.href = '/superadmin/dashboard';
        return;
      }
    }

    // Si el usuario tiene tenantSlug, solo redirigir si estamos en /dashboard exactamente
    // No redirigir si estamos en otras rutas válidas como /crm/customers/[id]
    if (!isLoading && isAuthenticated && userRole !== 'super_admin') {
      const tenantSlug = AuthService.getTenantSlug();
      const currentPath = window.location.pathname;
      
      // Solo redirigir si estamos en /dashboard exactamente, no en otras rutas
      if (tenantSlug && currentPath === '/dashboard') {
        console.log('🔄 Usuario con tenantSlug detectado en /dashboard, redirigiendo a /[slug]/dashboard');
        window.location.href = `/${tenantSlug}/dashboard`;
        return;
      }
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) {
    return <AppLoading message="Cargando dashboard..." />;
  }

  if (!isAuthenticated) {
    return null; // Middleware will redirect to login
  }

  // Si es superadmin, no renderizar (el useEffect redirigirá)
  // Priorizar systemRole sobre role
  const userRole = user?.systemRole || user?.role;
  if (userRole === 'super_admin') {
    return null;
  }

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
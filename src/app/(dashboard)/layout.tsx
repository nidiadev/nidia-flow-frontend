'use client';

import { useAuth } from '@/contexts/auth-context';
import { MainLayout } from '@/components/layout/main-layout';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
      console.log('🔄 Usuario superadmin detectado en layout de dashboard, redirigiendo a /superadmin/dashboard');
      // Usar window.location.href para forzar redirección inmediata
      window.location.href = '/superadmin/dashboard';
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-nidia-green" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
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
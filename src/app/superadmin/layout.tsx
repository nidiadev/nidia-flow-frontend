'use client';

import { useAuth } from '@/contexts/auth-context';
import { AdminLayout } from '@/components/layout/admin-layout';
import { AppLoading } from '@/components/ui/app-loading';
import { useEffect, useState, useRef } from 'react';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Prevenir múltiples ejecuciones
    if (hasCheckedRef.current) {
      return;
    }

    // Esperar a que termine la carga inicial
    if (isLoading) {
      setIsChecking(true);
      return;
    }

    // Marcar como verificado para evitar re-ejecuciones
    hasCheckedRef.current = true;
    setIsChecking(false);
  }, [isLoading]);

  // Mostrar loader mientras se verifica autenticación
  if (isLoading || isChecking) {
    return <AppLoading message="Cargando administración..." />;
  }

  // Si no está autenticado, mostrar loader (middleware redirigirá)
  if (!isAuthenticated) {
    return <AppLoading message="Verificando autenticación..." />;
  }

  // Verificar rol del usuario (priorizar systemRole)
  const userRole = user?.systemRole || user?.role;
  
  // Si no es superadmin, el middleware ya debería haber redirigido
  // Solo verificar si realmente no es super_admin (no si userRole es null/undefined)
  // Si userRole es null/undefined, confiar en el middleware y renderizar
  if (userRole && userRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-nidia-green" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Renderizar el layout de admin con los children
  // Asegurarse de que siempre se renderice algo, incluso si shouldRender es false inicialmente
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}


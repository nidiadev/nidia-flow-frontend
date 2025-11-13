'use client';

import { useAuth } from '@/contexts/auth-context';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Esperar a que termine la carga inicial
    if (isLoading) {
      setIsChecking(true);
      return;
    }

    setIsChecking(false);

    // Si no está autenticado, el middleware redirigirá
    if (!isAuthenticated) {
      console.log('⚠️ Usuario no autenticado en layout de admin');
      return;
    }

    // Verificar rol del usuario (priorizar systemRole)
    const userRole = user?.systemRole || user?.role;
    console.log('🔍 Verificando rol en layout de superadmin:', { userRole, systemRole: user?.systemRole, role: user?.role, user });
    
    if (userRole !== 'super_admin') {
      console.log('🔄 Usuario no es superadmin en layout de superadmin, redirigiendo a /dashboard');
      router.push('/dashboard');
    } else {
      console.log('✅ Usuario es superadmin, renderizando layout de superadmin');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Mostrar loader mientras se verifica autenticación
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-nidia-green" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar loader (middleware redirigirá)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-nidia-green" />
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Verificar rol del usuario (priorizar systemRole)
  const userRole = user?.systemRole || user?.role;
  
  // Si no es superadmin, mostrar loader mientras redirige
  if (userRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-nidia-green" />
          <p className="text-muted-foreground">Redirigiendo...</p>
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


'use client';

import { useAuth } from '@/contexts/auth-context';
import { MainLayout } from '@/components/layout/main-layout';
import { Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { AuthService } from '@/lib/auth';

export default function TenantSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  useEffect(() => {
    // Si el usuario es superadmin, redirigir al panel de administración
    const userRole = user?.systemRole || user?.role;
    if (!isLoading && isAuthenticated && userRole === 'super_admin') {
      console.log('🔄 Usuario superadmin detectado, redirigiendo a /superadmin/dashboard');
      window.location.href = '/superadmin/dashboard';
      return;
    }

    // Validar que el slug en la URL coincida con el slug del JWT
    if (!isLoading && isAuthenticated && slug) {
      const jwtSlug = AuthService.getTenantSlug();
      
      if (!jwtSlug) {
        // Si no hay slug en el JWT, redirigir al dashboard sin slug (fallback)
        console.warn('⚠️ No se encontró tenantSlug en el JWT, redirigiendo a /dashboard');
        router.replace('/dashboard');
        return;
      }
      
      if (slug !== jwtSlug) {
        // El slug en la URL no coincide con el del JWT, redirigir al correcto
        console.warn(`⚠️ Slug en URL (${slug}) no coincide con JWT (${jwtSlug}), redirigiendo...`);
        router.replace(`/${jwtSlug}/dashboard`);
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, slug, router]);

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
  const userRole = user?.systemRole || user?.role;
  if (userRole === 'super_admin') {
    return null;
  }

  // Validar slug antes de renderizar
  const jwtSlug = AuthService.getTenantSlug();
  if (slug && jwtSlug && slug !== jwtSlug) {
    return null; // El useEffect redirigirá
  }

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}


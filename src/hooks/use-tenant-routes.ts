import { useMemo } from 'react';
import { AuthService } from '@/lib/auth';
import { useAuth } from '@/contexts/auth-context';

/**
 * Hook para manejar rutas con slug del tenant
 * Automáticamente agrega el slug del tenant a las rutas
 */
export function useTenantRoutes() {
  const { user } = useAuth();
  const userRole = user?.systemRole || user?.role;
  const isSuperAdmin = userRole === 'super_admin';
  const tenantSlug = !isSuperAdmin ? AuthService.getTenantSlug() : null;

  /**
   * Agrega el slug del tenant a una ruta
   * @param path - Ruta sin slug (ej: '/crm/customers')
   * @returns Ruta con slug (ej: '/kamirodev/crm/customers') o ruta original si es superadmin
   * @throws Error si es tenant y no hay slug (no debe pasar en producción)
   */
  const route = useMemo(() => {
    return (path: string): string => {
      // Si es superadmin, retornar ruta original (sin slug)
      if (isSuperAdmin) {
        return path;
      }

      // Si es tenant y no hay slug, es un error del sistema
      if (!tenantSlug) {
        console.error('[useTenantRoutes] Tenant user without slug in JWT. This should not happen.');
        // En producción, esto no debería pasar. Retornamos la ruta original como último recurso
        // pero el usuario debería re-autenticarse
        return path;
      }

      // Si la ruta ya tiene el slug, retornarla tal cual
      if (path.startsWith(`/${tenantSlug}/`)) {
        return path;
      }

      // Si la ruta empieza con /, agregar el slug
      if (path.startsWith('/')) {
        return `/${tenantSlug}${path}`;
      }

      // Si no empieza con /, agregar /slug/
      return `/${tenantSlug}/${path}`;
    };
  }, [tenantSlug, isSuperAdmin]);

  return { route, tenantSlug, isSuperAdmin };
}


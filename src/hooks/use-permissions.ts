'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';

/**
 * Hook para verificar permisos granulares del usuario
 * Soporta jerarquía: 'crm:read' permite 'crm:customers:read'
 */
export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) return [];

    const userPermissions: string[] = [];

    // Agregar permisos del rol (backward compatibility)
    const rolePermissions = getRolePermissions(user.role);
    userPermissions.push(...rolePermissions);

    // Agregar permisos individuales del usuario
    if (user.permissions && Array.isArray(user.permissions)) {
      userPermissions.push(...user.permissions);
    }

    return [...new Set(userPermissions)]; // Eliminar duplicados
  }, [user]);

  /**
   * Verifica si el usuario tiene un permiso específico
   * Soporta jerarquía: 'crm:read' permite 'crm:customers:read'
   */
  const hasPermission = (requiredPermission: string): boolean => {
    // Admin siempre tiene todos los permisos
    if (permissions.includes('*') || permissions.includes('admin:*')) {
      return true;
    }

    // Coincidencia exacta
    if (permissions.includes(requiredPermission)) {
      return true;
    }

    // Parsear estructura: module:submodule:action o module:action
    const parts = requiredPermission.split(':');

    if (parts.length === 2) {
      // module:action (ej: 'crm:read')
      const [module, action] = parts;

      // Verificar permiso general del módulo
      if (permissions.includes(`${module}:*`)) {
        return true;
      }

      // Verificar acción específica en el módulo
      if (permissions.includes(`${module}:${action}`)) {
        return true;
      }
    } else if (parts.length === 3) {
      // module:submodule:action (ej: 'crm:customers:read')
      const [module, submodule, action] = parts;

      // Verificar permiso general del módulo (ej: 'crm:read' permite 'crm:customers:read')
      if (permissions.includes(`${module}:*`) || permissions.includes(`${module}:${action}`)) {
        return true;
      }

      // Verificar permiso específico del submódulo
      if (
        permissions.includes(`${module}:${submodule}:*`) ||
        permissions.includes(`${module}:${submodule}:${action}`)
      ) {
        return true;
      }
    }

    return false;
  };

  /**
   * Verifica si el usuario tiene alguno de los permisos requeridos (OR)
   */
  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some((permission) => hasPermission(permission));
  };

  /**
   * Verifica si el usuario tiene todos los permisos requeridos (AND)
   */
  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every((permission) => hasPermission(permission));
  };

  /**
   * Verifica si el usuario puede ver todos los datos (tiene permiso 'view_all')
   */
  const canViewAll = (): boolean => {
    return hasPermission('view_all') || hasPermission('*:view_all');
  };

  /**
   * Obtiene permisos de un módulo específico
   */
  const getModulePermissions = (module: string) => {
    const actions = ['read', 'write', 'delete', 'export', 'assign', 'approve', 'manage'];
    const result: Record<string, boolean> = {};

    actions.forEach((action) => {
      result[action] = hasPermission(`${module}:${action}`);
    });

    return result as {
      read: boolean;
      write: boolean;
      delete: boolean;
      export: boolean;
      assign: boolean;
      approve: boolean;
      manage: boolean;
    };
  };

  /**
   * Obtiene permisos de un submódulo específico
   */
  const getSubModulePermissions = (module: string, submodule: string) => {
    const actions = ['read', 'write', 'delete', 'export', 'assign', 'approve', 'manage'];
    const result: Record<string, boolean> = {};

    actions.forEach((action) => {
      // Verificar permiso específico del submódulo
      const specific = hasPermission(`${module}:${submodule}:${action}`);
      // Verificar permiso general del módulo
      const general = hasPermission(`${module}:${action}`);

      result[action] = specific || general;
    });

    return result as {
      read: boolean;
      write: boolean;
      delete: boolean;
      export: boolean;
      assign: boolean;
      approve: boolean;
      manage: boolean;
    };
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewAll,
    getModulePermissions,
    getSubModulePermissions,
  };
}

/**
 * Obtiene permisos por defecto de un rol
 * Esto es para backward compatibility. En producción, los roles deberían
 * estar en la base de datos con sus permisos asociados.
 */
function getRolePermissions(role: string): string[] {
  // Admin tiene todos los permisos
  if (role === 'admin') {
    return ['*', 'view_all', '*:view_all'];
  }

  // Permisos por defecto de roles (pueden ser sobrescritos por permisos individuales)
  const rolePermissionMap: Record<string, string[]> = {
    manager: [
      'crm:read',
      'crm:write',
      'crm:export',
      'crm:assign',
      'orders:read',
      'orders:write',
      'orders:assign',
      'orders:approve',
      'tasks:read',
      'tasks:write',
      'tasks:assign',
      'tasks:complete',
      'products:read',
      'products:write',
      'products:manage_inventory',
      'accounting:read',
      'accounting:reports',
      'reports:read',
      'reports:create',
      'reports:export',
      'users:read',
      'users:write',
      'users:invite',
      'view_all', // Managers pueden ver todos los datos
    ],
    sales: [
      'crm:customers:read',
      'crm:customers:write',
      'crm:customers:export',
      'crm:interactions:read',
      'crm:interactions:write',
      'orders:read',
      'orders:write',
      'tasks:read',
      'tasks:write',
      'products:read',
      'reports:read',
      // Nota: sales NO tiene 'view_all', solo ve sus propios datos
    ],
    operator: [
      'crm:read',
      'orders:read',
      'tasks:read',
      'tasks:write',
      'tasks:complete',
      'products:read',
    ],
    accountant: [
      'crm:read',
      'orders:read',
      'accounting:read',
      'accounting:write',
      'accounting:reports',
      'reports:read',
      'reports:create',
      'reports:export',
      'view_all', // Accountants pueden ver todos los datos financieros
    ],
    viewer: [
      'crm:read',
      'orders:read',
      'tasks:read',
      'products:read',
      'accounting:read',
      'reports:read',
    ],
  };

  return rolePermissionMap[role] || [];
}


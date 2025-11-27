'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { TableAction } from './types';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';

interface TableActionsProps {
  actions: TableAction[];
  className?: string;
}

/**
 * Componente de acciones globales de la tabla
 * Botones que aparecen en el header (Exportar, Nuevo, etc.)
 */
export function TableActions({ actions, className }: TableActionsProps) {
  const { hasPermission, hasAnyPermission } = usePermissions();

  // Filtrar acciones según permisos
  const filteredActions = actions.filter((action) => {
    if (!action.requiredPermission) return true;
    if (Array.isArray(action.requiredPermission)) {
      return hasAnyPermission(action.requiredPermission);
    }
    return hasPermission(action.requiredPermission);
  });

  if (filteredActions.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {filteredActions.map((action, index) => {
        // Si hay un render personalizado, usarlo
        if (action.render) {
          return <div key={index}>{action.render()}</div>;
        }
        
        // Renderizar botón estándar
        return (
          <Button
            key={index}
            variant={action.variant || 'default'}
            size={action.size || 'sm'}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}


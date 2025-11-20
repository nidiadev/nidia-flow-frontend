'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Estandarizado header de sección para páginas
 * Sin gradientes, texto más pequeño y diseño limpio
 * 
 * @example
 * <SectionHeader
 *   title="Lista de Clientes"
 *   description="Gestiona y organiza tu base de clientes y leads"
 *   actions={<Button>Nuevo Cliente</Button>}
 * />
 */
export function SectionHeader({ 
  title, 
  description, 
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div>
        <h1 className="text-lg font-semibold text-foreground mb-1">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}


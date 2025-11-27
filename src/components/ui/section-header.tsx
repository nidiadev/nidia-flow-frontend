'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  showBack?: boolean;
  onBack?: () => void;
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
 *   showBack
 * />
 */
export function SectionHeader({ 
  title, 
  description, 
  actions,
  className,
  showBack = false,
  onBack,
}: SectionHeaderProps) {
  const router = useRouter();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-3">
        {showBack && (
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        )}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-1">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}


'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  variant?: 'default' | 'gradient';
  showBack?: boolean;
  onBack?: () => void;
}

/**
 * Standardized page header component for consistent titles across SuperAdmin and Tenant pages
 * 
 * @example
 * <PageHeader
 *   title="Gestión de Clientes"
 *   description="Administra todas las empresas registradas en el sistema"
 *   actions={<Button>Nuevo Cliente</Button>}
 * />
 */
export function PageHeader({ 
  title, 
  description, 
  actions,
  className,
  variant = 'default',
  showBack = false,
  onBack
}: PageHeaderProps) {
  const router = useRouter();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className={cn('flex items-start justify-between mb-8', className)}>
      <div className="flex items-center space-x-4">
        {showBack && (
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        )}
        <div>
          {variant === 'gradient' ? (
            <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">
              {title}
            </h1>
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
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


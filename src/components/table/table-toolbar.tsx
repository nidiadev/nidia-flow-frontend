'use client';

import { ReactNode, useState } from 'react';
import { ViewToggle } from '@/components/ui/view-toggle';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { TableViewMode } from './types';
import { cn } from '@/lib/utils';

interface TableToolbarProps {
  viewMode: TableViewMode;
  onViewModeChange: (mode: TableViewMode) => void;
  showViewToggle?: boolean;
  className?: string;
  // Búsqueda integrada
  search?: ReactNode;
  // Filtros básicos (siempre visibles)
  basicFilters?: ReactNode;
  // Filtros avanzados
  advancedFilters?: {
    enabled: boolean;
    label?: string;
    content: ReactNode;
    activeCount?: number;
  };
  // Acciones globales (botones a la derecha)
  actions?: ReactNode;
}

/**
 * Barra de herramientas de la tabla mejorada
 * Incluye: Toggle vista, búsqueda, filtros básicos, filtros avanzados y acciones
 * Diseño inspirado en dashboards profesionales
 */
export function TableToolbar({
  viewMode,
  onViewModeChange,
  showViewToggle = true,
  className,
  search,
  basicFilters,
  advancedFilters,
  actions,
}: TableToolbarProps) {
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Primera fila: Toggle, Búsqueda y Acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Izquierda: Toggle y Búsqueda */}
        <div className="flex flex-1 items-center gap-3 w-full">
      {showViewToggle && (
          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          )}
          {search && <div className="flex-1 max-w-md">{search}</div>}
        </div>

        {/* Derecha: Filtros avanzados y Acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {advancedFilters?.enabled && (
            <Sheet open={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  {advancedFilters.label || 'Filtros Avanzados'}
                  {advancedFilters.activeCount && advancedFilters.activeCount > 0 && (
                    <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {advancedFilters.activeCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Filtros Avanzados</SheetTitle>
                  <SheetDescription>
                    Configura filtros detallados para encontrar exactamente lo que buscas
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  {advancedFilters.content}
                </div>
              </SheetContent>
            </Sheet>
          )}
          {actions}
        </div>
      </div>

      {/* Segunda fila: Filtros básicos (si existen) */}
      {basicFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {basicFilters}
        </div>
      )}
    </div>
  );
}

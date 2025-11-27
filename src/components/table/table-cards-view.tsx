'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TableCardsViewProps<T> {
  data: T[];
  renderCard: (item: T) => ReactNode;
  gridCols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  isLoading?: boolean;
  emptyState?: {
    icon?: ReactNode;
    title?: string;
    description?: string;
    action?: ReactNode;
  };
  className?: string;
}

/**
 * Vista de cards para la tabla
 * Renderiza los datos en formato de grid de cards
 */
export function TableCardsView<T>({
  data,
  renderCard,
  gridCols = {
    default: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
  },
  isLoading = false,
  emptyState,
  className,
}: TableCardsViewProps<T>) {
  // Generar clases de grid para skeleton
  const getSkeletonGridClasses = () => {
    const classes: string[] = ['grid', 'gap-4', 'grid-cols-1'];
    
    const gridMap: Record<number, Record<string, string>> = {
      1: { sm: 'sm:grid-cols-1', md: 'md:grid-cols-1', lg: 'lg:grid-cols-1', xl: 'xl:grid-cols-1' },
      2: { sm: 'sm:grid-cols-2', md: 'md:grid-cols-2', lg: 'lg:grid-cols-2', xl: 'xl:grid-cols-2' },
      3: { sm: 'sm:grid-cols-3', md: 'md:grid-cols-3', lg: 'lg:grid-cols-3', xl: 'xl:grid-cols-3' },
      4: { sm: 'sm:grid-cols-4', md: 'md:grid-cols-4', lg: 'lg:grid-cols-4', xl: 'xl:grid-cols-4' },
    };

    if (gridCols.sm && gridMap[gridCols.sm]) classes.push(gridMap[gridCols.sm].sm);
    if (gridCols.md && gridMap[gridCols.md]) classes.push(gridMap[gridCols.md].md);
    if (gridCols.lg && gridMap[gridCols.lg]) classes.push(gridMap[gridCols.lg].lg);
    if (gridCols.xl && gridMap[gridCols.xl]) classes.push(gridMap[gridCols.xl].xl);

    return classes;
  };

  // Skeleton loading
  if (isLoading) {
    return (
      <div className={cn(getSkeletonGridClasses(), className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-muted rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (data.length === 0 && emptyState) {
    return (
      <div className="text-center py-16 px-6">
        {emptyState.icon && <div className="mb-4 flex justify-center">{emptyState.icon}</div>}
        {emptyState.title && (
          <h3 className="text-lg font-medium mb-2 text-foreground">{emptyState.title}</h3>
        )}
        {emptyState.description && (
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{emptyState.description}</p>
        )}
        {emptyState.action && <div>{emptyState.action}</div>}
      </div>
    );
  }

  // Generar clases de grid estáticas (Tailwind requiere clases completas)
  const getGridClasses = () => {
    const classes: string[] = ['grid', 'gap-4', 'grid-cols-1'];
    
    const gridMap: Record<number, Record<string, string>> = {
      1: { sm: 'sm:grid-cols-1', md: 'md:grid-cols-1', lg: 'lg:grid-cols-1', xl: 'xl:grid-cols-1', '2xl': '2xl:grid-cols-1' },
      2: { sm: 'sm:grid-cols-2', md: 'md:grid-cols-2', lg: 'lg:grid-cols-2', xl: 'xl:grid-cols-2', '2xl': '2xl:grid-cols-2' },
      3: { sm: 'sm:grid-cols-3', md: 'md:grid-cols-3', lg: 'lg:grid-cols-3', xl: 'xl:grid-cols-3', '2xl': '2xl:grid-cols-3' },
      4: { sm: 'sm:grid-cols-4', md: 'md:grid-cols-4', lg: 'lg:grid-cols-4', xl: 'xl:grid-cols-4', '2xl': '2xl:grid-cols-4' },
      5: { sm: 'sm:grid-cols-5', md: 'md:grid-cols-5', lg: 'lg:grid-cols-5', xl: 'xl:grid-cols-5', '2xl': '2xl:grid-cols-5' },
      6: { sm: 'sm:grid-cols-6', md: 'md:grid-cols-6', lg: 'lg:grid-cols-6', xl: 'xl:grid-cols-6', '2xl': '2xl:grid-cols-6' },
    };

    if (gridCols.sm && gridMap[gridCols.sm]) classes.push(gridMap[gridCols.sm].sm);
    if (gridCols.md && gridMap[gridCols.md]) classes.push(gridMap[gridCols.md].md);
    if (gridCols.lg && gridMap[gridCols.lg]) classes.push(gridMap[gridCols.lg].lg);
    if (gridCols.xl && gridMap[gridCols.xl]) classes.push(gridMap[gridCols.xl].xl);
    if (gridCols['2xl'] && gridMap[gridCols['2xl']]) classes.push(gridMap[gridCols['2xl']]['2xl']);

    return classes;
  };

  // Renderizar cards
  return (
    <div className={cn(getGridClasses(), className)}>
      {data.map((item, index) => (
        <div key={index}>{renderCard(item)}</div>
      ))}
    </div>
  );
}


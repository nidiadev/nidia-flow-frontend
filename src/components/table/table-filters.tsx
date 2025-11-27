'use client';

import { TableFilterConfig } from './types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TableFiltersProps {
  filters: TableFilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  className?: string;
}

/**
 * Componente de filtros para la tabla
 * Renderiza filtros configurables (select, multiselect, etc.)
 */
export function TableFilters({
  filters,
  values,
  onChange,
  className,
}: TableFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {filters.map((filter) => {
        // Si tiene render personalizado, usarlo
        if (filter.render) {
          return (
            <div key={filter.key}>
              {filter.render({
                value: values[filter.key],
                onChange: (value) => onChange(filter.key, value),
              })}
            </div>
          );
        }

        // Renderizado por defecto según tipo
        switch (filter.type) {
          case 'select':
            return (
              <Select
                key={filter.key}
                value={values[filter.key] || 'all'}
                onValueChange={(value) => onChange(filter.key, value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={filter.placeholder || filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );

          case 'multiselect':
            // TODO: Implementar multiselect cuando sea necesario
            return null;

          default:
            return null;
        }
      })}
    </div>
  );
}


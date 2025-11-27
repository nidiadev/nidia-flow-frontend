'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Componente de búsqueda para la tabla
 */
export function TableSearch({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
  disabled = false,
}: TableSearchProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 w-full h-10 bg-background border-input"
        disabled={disabled}
      />
    </div>
  );
}


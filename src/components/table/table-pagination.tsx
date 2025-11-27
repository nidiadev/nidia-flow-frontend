'use client';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  className?: string;
}

/**
 * Componente de paginación para la tabla
 * Soporta paginación del cliente y del servidor
 */
export function TablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = false,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: TablePaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Generar números de página con ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica con ellipsis
      if (page <= 3) {
        // Al inicio
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        // Al final
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // En el medio
        pages.push(1);
        pages.push('ellipsis');
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className={cn('flex items-center justify-between py-3', className)}>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {start} - {end} de {total} resultado{total !== 1 ? 's' : ''}
        </div>
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>

          {getPageNumbers().map((pageNum, index) => {
            if (pageNum === 'ellipsis') {
              return (
                <PaginationItem key={`ellipsis-${index}`}>
                  <span className="px-2 text-muted-foreground">...</span>
                </PaginationItem>
              );
            }

            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => onPageChange(pageNum)}
                  isActive={page === pageNum}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}


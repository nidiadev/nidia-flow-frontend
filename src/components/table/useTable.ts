import { useState, useMemo, useEffect, useCallback } from 'react';
import { useViewMode } from '@/hooks/use-view-mode';
import { TableConfig, TableState, TableViewMode } from './types';

/**
 * Hook personalizado para manejar toda la lógica de la tabla
 * Centraliza: búsqueda, filtros, ordenamiento, paginación, vista, etc.
 */
export function useTable<T>(config: TableConfig<T>) {
  const {
    id = 'table',
    data,
    defaultViewMode = 'table',
    search,
    filters = [],
    sorting,
    pagination,
    onFiltersChange,
  } = config;
  
  // Extraer callbacks de configuraciones anidadas
  const onSortChange = sorting?.onSortChange;
  const onSearch = search?.onSearch;

  // Vista (persistida en localStorage)
  const storageKey = `${id}-view-mode`;
  const { viewMode, setViewMode, isTableView, isCardsView } = useViewMode(
    storageKey,
    defaultViewMode
  );

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Filtros
  const initialFilters = useMemo(() => {
    const initial: Record<string, any> = {};
    filters.forEach((filter) => {
      if (filter.defaultValue !== undefined) {
        initial[filter.key] = filter.defaultValue;
      }
    });
    return initial;
  }, [filters]);

  const [activeFilters, setActiveFilters] = useState<Record<string, any>>(initialFilters);

  // Ordenamiento
  const [sort, setSort] = useState<{ field: string; order: 'asc' | 'desc' } | null>(
    sorting?.defaultSort || null
  );

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 20);

  // Selección de filas
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Debounce de búsqueda
  useEffect(() => {
    if (!search?.enabled) return;

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, search.debounceMs || 300);

    return () => clearTimeout(timer);
  }, [searchTerm, search, onSearch]);

  // Aplicar filtros
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(activeFilters);
    }
  }, [activeFilters, onFiltersChange]);

  // Aplicar ordenamiento
  useEffect(() => {
    if (onSortChange && sort) {
      onSortChange(sort);
    }
  }, [sort, onSortChange]);

  // Resetear página cuando cambian filtros o búsqueda
  useEffect(() => {
    setPage(1);
  }, [activeFilters, debouncedSearchTerm, sort]);

  // Filtrar datos localmente (si no es server-side)
  const filteredData = useMemo(() => {
    let result = [...data];

    // Búsqueda local (si no hay callback onSearch)
    if (search?.enabled && debouncedSearchTerm && !onSearch) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter((item) => {
        // Búsqueda simple en todos los campos string del objeto
        return JSON.stringify(item).toLowerCase().includes(term);
      });
    }

    // Filtros locales (si no hay callback onFiltersChange)
    if (filters.length > 0 && !onFiltersChange) {
      result = result.filter((item) => {
        return filters.every((filter) => {
          const filterValue = activeFilters[filter.key];
          if (!filterValue || filterValue === 'all') return true;

          // Lógica básica de filtrado
          const itemValue = (item as any)[filter.key];
          if (Array.isArray(filterValue)) {
            return filterValue.includes(itemValue);
          }
          return itemValue === filterValue;
        });
      });
    }

    // Ordenamiento local (si no hay callback onSortChange)
    if (sort && !onSortChange) {
      result.sort((a, b) => {
        const aValue = (a as any)[sort.field];
        const bValue = (b as any)[sort.field];

        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return sort.order === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, debouncedSearchTerm, activeFilters, filters, sort, search, onSearch, onFiltersChange, onSortChange]);

  // Paginación local (si no es server-side)
  const paginatedData = useMemo(() => {
    if (!pagination?.enabled || pagination.serverSide) {
      return filteredData;
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, page, pageSize, pagination]);

  // Calcular total de páginas
  const totalPages = useMemo(() => {
    if (pagination?.serverSide && pagination.total) {
      return Math.ceil(pagination.total / pageSize);
    }
    return Math.ceil(filteredData.length / pageSize);
  }, [filteredData.length, pageSize, pagination?.serverSide, pagination?.total]);

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    setSort({ field, order });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    if (pagination?.onPageChange) {
      pagination.onPageChange(newPage);
    }
  }, [pagination]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset a primera página
    if (pagination?.onPageSizeChange) {
      pagination.onPageSizeChange(newPageSize);
    }
  }, [pagination]);

  const handleViewModeChange = useCallback((mode: TableViewMode) => {
    setViewMode(mode);
    if (config.onViewModeChange) {
      config.onViewModeChange(mode);
    }
  }, [setViewMode, config]);

  const resetFilters = useCallback(() => {
    setActiveFilters(initialFilters);
    setSearchTerm('');
    setSort(sorting?.defaultSort || null);
    setPage(1);
  }, [initialFilters, sorting]);

  // Estado completo
  const state: TableState = {
    viewMode,
    searchTerm,
    filters: activeFilters,
    sort,
    page,
    pageSize,
    selectedRows,
  };

  return {
    // Estado
    state,
    viewMode,
    isTableView,
    isCardsView,
    searchTerm,
    activeFilters,
    sort,
    page,
    pageSize,
    selectedRows,
    filteredData,
    paginatedData,
    totalPages,

    // Handlers
    setViewMode: handleViewModeChange,
    setSearchTerm: handleSearchChange,
    setFilter: handleFilterChange,
    setSort: handleSortChange,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    setSelectedRows,
    resetFilters,

    // Utilidades
    hasActiveFilters: Object.values(activeFilters).some(
      (value) => value !== undefined && value !== null && value !== '' && value !== 'all'
    ),
    hasSearchTerm: searchTerm.length > 0,
    canGoPrevious: page > 1,
    canGoNext: page < totalPages,
  };
}


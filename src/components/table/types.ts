import { ColumnDef } from '@tanstack/react-table';
import { ReactNode } from 'react';

/**
 * Modo de vista de la tabla
 */
export type TableViewMode = 'table' | 'cards';

/**
 * Configuración de filtros personalizados
 */
export interface TableFilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'dateRange' | 'number' | 'custom';
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string | string[];
  // Para filtros personalizados
  render?: (props: {
    value: any;
    onChange: (value: any) => void;
  }) => ReactNode;
  // Si es true, el filtro aparece en "Filtros Avanzados"
  advanced?: boolean;
}

/**
 * Configuración de filtros avanzados
 */
export interface TableAdvancedFiltersConfig {
  enabled: boolean;
  label?: string;
  render?: (props: {
    filters: Record<string, any>;
    onChange: (filters: Record<string, any>) => void;
    onReset: () => void;
  }) => ReactNode;
}

/**
 * Configuración de acciones globales (botones en el header)
 */
export interface TableAction {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  requiredPermission?: string | string[];
  // Permite renderizar un componente personalizado (ej: Dialog trigger)
  render?: () => ReactNode;
}

/**
 * Configuración de acciones por fila (menú dropdown)
 */
export interface TableRowAction<T> {
  label: string | ((row: T) => string);
  icon?: ReactNode | ((row: T) => ReactNode);
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive' | 'warning';
  separator?: boolean;
  disabled?: boolean | ((row: T) => boolean);
  requiredPermission?: string | string[];
}

/**
 * Configuración de paginación
 */
export interface TablePaginationConfig {
  enabled: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  // Para paginación del servidor
  serverSide?: boolean;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Configuración de búsqueda
 */
export interface TableSearchConfig {
  enabled: boolean;
  placeholder?: string;
  debounceMs?: number;
  onSearch?: (searchTerm: string) => void;
}

/**
 * Configuración de vista de cards
 */
export interface TableCardsConfig<T> {
  enabled: boolean;
  renderCard: (item: T) => ReactNode;
  gridCols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  emptyState?: {
    icon?: ReactNode;
    title?: string;
    description?: string;
    action?: ReactNode;
  };
}

/**
 * Configuración de exportación
 */
export interface TableExportConfig {
  enabled: boolean;
  formats?: ('csv' | 'xlsx' | 'pdf')[];
  filename?: string;
  onExport?: (format: 'csv' | 'xlsx' | 'pdf') => void;
}

/**
 * Configuración de estadísticas (cards de métricas arriba)
 */
export interface TableStatsConfig {
  enabled: boolean;
  stats: Array<{
    label: string;
    value: string | number;
    description?: string;
    icon?: ReactNode;
    trend?: {
      value: number;
      isPositive: boolean;
    };
    // Soporte para gráficas (donut, bar, line, etc.)
    chart?: {
      type: 'donut' | 'bar' | 'line' | 'area';
      data: Array<{
        label: string;
        value: number;
        color?: string;
      }>;
      total?: number;
    };
  }>;
}

/**
 * Configuración completa de la tabla
 */
export interface TableConfig<T> {
  // Identificador único para persistir preferencias
  id?: string;
  
  // Datos y columnas
  data: T[];
  columns: ColumnDef<T>[];
  
  // Vista
  viewMode?: TableViewMode;
  defaultViewMode?: TableViewMode;
  onViewModeChange?: (mode: TableViewMode) => void;
  
  // Búsqueda
  search?: TableSearchConfig;
  
  // Filtros
  filters?: TableFilterConfig[];
  onFiltersChange?: (filters: Record<string, any>) => void;
  advancedFilters?: TableAdvancedFiltersConfig;
  
  // Ordenamiento
  sorting?: {
    enabled: boolean;
    defaultSort?: { field: string; order: 'asc' | 'desc' };
    onSortChange?: (sort: { field: string; order: 'asc' | 'desc' }) => void;
  };
  
  // Paginación
  pagination?: TablePaginationConfig;
  
  // Acciones
  actions?: TableAction[];
  rowActions?: TableRowAction<T>[];
  
  // Vista de cards
  cards?: TableCardsConfig<T>;
  
  // Exportación
  export?: TableExportConfig;
  
  // Estadísticas
  stats?: TableStatsConfig;
  
  // Estados
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  
  // Mensajes vacíos
  emptyState?: {
    icon?: ReactNode;
    title?: string;
    description?: string;
    action?: ReactNode;
  };
  
  // Callbacks
  onRowClick?: (row: T) => void;
  onRowSelectionChange?: (selectedRows: T[]) => void;
  
  // Características avanzadas
  features?: {
    columnVisibility?: boolean;
    columnSizing?: boolean;
    columnPinning?: boolean;
    rowSelection?: boolean;
    grouping?: boolean;
    expanding?: boolean;
  };
  
  // Layout
  layout?: {
    containerClassName?: string;
    showBorder?: boolean;
    showHeader?: boolean;
    headerTitle?: string;
    headerDescription?: string;
    headerClassName?: string;
  };
  
  // Identificador de fila
  getRowId?: (row: T) => string;
}

/**
 * Estado interno de la tabla
 */
export interface TableState {
  viewMode: TableViewMode;
  searchTerm: string;
  filters: Record<string, any>;
  sort: { field: string; order: 'asc' | 'desc' } | null;
  page: number;
  pageSize: number;
  selectedRows: string[];
}


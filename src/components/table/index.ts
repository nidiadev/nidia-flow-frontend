/**
 * Componente global de tabla estandarizado
 * 
 * Este módulo proporciona un componente de tabla completamente estandarizado
 * que unifica todas las funcionalidades comunes: búsqueda, filtros, paginación,
 * vista tabla/cards, acciones, estadísticas, etc.
 * 
 * @module Table
 */

export { Table } from './Table';
export { useTable } from './useTable';
export type {
  TableConfig,
  TableViewMode,
  TableFilterConfig,
  TableAdvancedFiltersConfig,
  TableAction,
  TableRowAction,
  TablePaginationConfig,
  TableSearchConfig,
  TableCardsConfig,
  TableExportConfig,
  TableStatsConfig,
  TableState,
} from './types';

// Subcomponentes (exportados por si se necesitan usar individualmente)
export { TableToolbar } from './table-toolbar';
export { TableSearch } from './table-search';
export { TableFilters } from './table-filters';
export { TableActions } from './table-actions';
export { TablePagination } from './table-pagination';
export { TableCardsView } from './table-cards-view';
export { TableStats } from './table-stats';


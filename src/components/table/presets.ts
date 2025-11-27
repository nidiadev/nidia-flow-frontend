import { TableConfig } from './types';
import { ColumnDef } from '@tanstack/react-table';
import React from 'react';

/**
 * Presets pre-configurados para casos de uso comunes
 * Facilita la creación de tablas con configuraciones estándar
 */

/**
 * Preset básico: Tabla simple con búsqueda y paginación
 */
export function createBasicTablePreset<T>(
  data: T[],
  columns: ColumnDef<T>[]
): Partial<TableConfig<T>> {
  return {
    data,
    columns,
    search: {
      enabled: true,
      placeholder: 'Buscar...',
    },
    pagination: {
      enabled: true,
      pageSize: 20,
      showPageInfo: true,
    },
    cards: {
      enabled: false,
      renderCard: () => null,
    },
  };
}

/**
 * Preset para CRM: Clientes, Leads, etc.
 * Incluye búsqueda, filtros de tipo, vista cards, estadísticas
 */
export function createCRMTablePreset<T>(
  data: T[],
  columns: ColumnDef<T>[],
  options?: {
    renderCard?: (item: T) => React.ReactNode;
    filterOptions?: Array<{ value: string; label: string }>;
    stats?: TableConfig<T>['stats'];
  }
): Partial<TableConfig<T>> {
  return {
    data,
    columns,
    id: 'crm-table',
    search: {
      enabled: true,
      placeholder: 'Buscar por nombre, email, empresa...',
    },
    filters: options?.filterOptions
      ? [
          {
            key: 'type',
            label: 'Tipo',
            type: 'select',
            options: [{ value: 'all', label: 'Todos los tipos' }, ...options.filterOptions],
            defaultValue: 'all',
          },
        ]
      : [],
    sorting: {
      enabled: true,
      defaultSort: { field: 'createdAt', order: 'desc' },
    },
    pagination: {
      enabled: true,
      pageSize: 20,
      showPageInfo: true,
    },
    cards: {
      enabled: true,
      renderCard: options?.renderCard || (() => null),
      gridCols: {
        default: 1,
        sm: 2,
        md: 2,
        lg: 3,
        xl: 4,
      },
    },
    stats: options?.stats,
  };
}

/**
 * Preset para Catálogo de Productos
 * Incluye búsqueda, filtros de tipo y stock, vista cards
 */
export function createProductCatalogPreset<T>(
  data: T[],
  columns: ColumnDef<T>[],
  options?: {
    renderCard?: (item: T) => React.ReactNode;
    stats?: TableConfig<T>['stats'];
  }
): Partial<TableConfig<T>> {
  return {
    data,
    columns,
    id: 'products-catalog',
    search: {
      enabled: true,
      placeholder: 'Buscar por nombre, SKU o descripción...',
    },
    filters: [
      {
        key: 'type',
        label: 'Tipo',
        type: 'select',
        options: [
          { value: 'all', label: 'Todos los tipos' },
          { value: 'product', label: 'Productos' },
          { value: 'service', label: 'Servicios' },
          { value: 'combo', label: 'Combos' },
        ],
        defaultValue: 'all',
      },
      {
        key: 'stock',
        label: 'Stock',
        type: 'select',
        options: [
          { value: 'all', label: 'Todos' },
          { value: 'in_stock', label: 'En stock' },
          { value: 'low_stock', label: 'Stock bajo' },
          { value: 'out_of_stock', label: 'Sin stock' },
        ],
        defaultValue: 'all',
      },
    ],
    sorting: {
      enabled: true,
      defaultSort: { field: 'name', order: 'asc' },
    },
    pagination: {
      enabled: true,
      pageSize: 20,
      showPageInfo: true,
    },
    cards: {
      enabled: true,
      renderCard: options?.renderCard || (() => null),
      gridCols: {
        default: 1,
        sm: 2,
        md: 2,
        lg: 3,
        xl: 4,
      },
    },
    stats: options?.stats,
  };
}

/**
 * Preset para tablas simples sin filtros complejos
 * Solo búsqueda y paginación básica
 */
export function createSimpleTablePreset<T>(
  data: T[],
  columns: ColumnDef<T>[]
): Partial<TableConfig<T>> {
  return {
    data,
    columns,
    search: {
      enabled: true,
      placeholder: 'Buscar...',
    },
    pagination: {
      enabled: true,
      pageSize: 10,
      showPageInfo: true,
    },
    cards: {
      enabled: false,
      renderCard: () => null,
    },
  };
}


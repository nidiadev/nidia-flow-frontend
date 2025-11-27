'use client';

import { useMemo, useState } from 'react';
import { TableConfig } from './types';
import { useTable } from './useTable';
import { TableSearch } from './table-search';
import { TableFilters } from './table-filters';
import { TableActions } from './table-actions';
import { TablePagination } from './table-pagination';
import { TableCardsView } from './table-cards-view';
import { TableStats } from './table-stats';
import { DataTable, DataTableAction } from '@/components/ui/data-table';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ViewToggle } from '@/components/ui/view-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileQuestion } from 'lucide-react';

/**
 * Componente global de tabla estandarizado
 * 
 * SIN card/contenedor - layout limpio y consistente
 * Todo en una sola fila: Búsqueda | Filtros | Toggle | Acciones
 */
export function Table<T>(config: TableConfig<T>) {
  const {
    id = 'table',
    data,
    columns,
    search,
    filters = [],
    advancedFilters,
    pagination,
    actions = [],
    rowActions,
    cards,
    stats,
    isLoading = false,
    isError = false,
    error = null,
    onRetry,
    emptyState,
    layout,
    features,
    getRowId,
    onRowClick,
  } = config;

  // Hook personalizado con toda la lógica
  const table = useTable(config);
  
  // Estado para filtros avanzados
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  // Convertir rowActions a formato DataTableAction
  const dataTableActions: DataTableAction<T>[] = useMemo(() => {
    if (!rowActions) return [];
    return rowActions.map((action) => ({
      label: action.label,
      icon: action.icon,
      onClick: action.onClick,
      variant: action.variant,
      separator: action.separator,
      disabled: action.disabled,
      requiredPermission: action.requiredPermission,
    }));
  }, [rowActions]);

  // Separar filtros básicos y avanzados
  const basicFilters = useMemo(() => {
    return filters.filter(f => !f.advanced);
  }, [filters]);

  const advancedFiltersList = useMemo(() => {
    return filters.filter(f => f.advanced);
  }, [filters]);

  // Contar filtros avanzados activos
  const activeAdvancedFiltersCount = useMemo(() => {
    if (!advancedFiltersList.length) return 0;
    return Object.values(table.activeFilters).filter(
      (value) => value !== undefined && value !== null && value !== '' && value !== 'all'
    ).length;
  }, [table.activeFilters, advancedFiltersList]);

  // Datos a mostrar (paginados si es necesario)
  const displayData = pagination?.enabled && !pagination.serverSide
    ? table.paginatedData
    : table.filteredData;

  // Total para paginación
  const total = pagination?.serverSide && pagination.total
    ? pagination.total
    : table.filteredData.length;

  // Empty state mejorado
  const defaultEmptyState = {
    icon: emptyState?.icon || <FileQuestion className="h-16 w-16 text-muted-foreground/50" />,
    title: emptyState?.title || 'No se encontraron resultados',
    description: emptyState?.description || 'No hay datos para mostrar en este momento',
    action: emptyState?.action,
  };

  return (
    <ErrorBoundary>
      <div className="space-y-3">
        {/* Toolbar: TODO en UNA SOLA FILA - Búsqueda | Filtros | Toggle | Acciones */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Izquierda: Búsqueda + Filtros */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Búsqueda - un poco más larga */}
            {search?.enabled && (
              <div className="w-full sm:w-[340px]">
                <TableSearch
                  value={table.searchTerm}
                  onChange={table.setSearchTerm}
                  placeholder={search.placeholder}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Filtros Avanzados */}
            {(advancedFilters?.enabled || advancedFiltersList.length > 0) && (
              <Sheet open={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="default" className="relative whitespace-nowrap">
                    <Filter className="h-4 w-4 mr-2" />
                    {advancedFilters?.label || 'Filtros'}
                    {activeAdvancedFiltersCount > 0 && (
                      <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {activeAdvancedFiltersCount}
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
                    {advancedFilters?.render ? (
                      advancedFilters.render({
                        filters: table.activeFilters,
                        onChange: (newFilters) => {
                          Object.entries(newFilters).forEach(([key, value]) => {
                            table.setFilter(key, value);
                          });
                        },
                        onReset: () => {
                          table.resetFilters();
                        },
                      })
                    ) : advancedFiltersList.length > 0 ? (
                      <TableFilters
                        filters={advancedFiltersList}
                        values={table.activeFilters}
                        onChange={table.setFilter}
                      />
                    ) : null}
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {/* Filtros básicos inline */}
            {basicFilters.length > 0 && (
              <TableFilters
                filters={basicFilters}
                values={table.activeFilters}
                onChange={table.setFilter}
              />
            )}
          </div>

          {/* Derecha: Acciones */}
          {actions.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <TableActions actions={actions} />
            </div>
          )}
        </div>

        {/* Estadísticas */}
        {stats?.enabled && stats.stats && (
          <TableStats stats={stats.stats} columns={stats.stats.length} />
        )}

        {/* Contenido - SIN CARD, directo */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error}
          emptyFallback={null}
          onRetry={onRetry}
        >
          {table.isTableView ? (
            // Vista de tabla - directa sin wrapper
            <DataTable
              data={displayData}
              columns={columns}
              searchPlaceholder={search?.placeholder}
              emptyMessage={defaultEmptyState.title}
              emptyDescription={defaultEmptyState.description}
              isLoading={isLoading}
              onRowClick={onRowClick}
              actions={dataTableActions}
              pageSize={pagination?.pageSize || 20}
              showSearch={false}
              showPagination={false}
              toolbarLeftContent={
                cards?.enabled ? (
                  <ViewToggle viewMode={table.viewMode} onViewModeChange={table.setViewMode} />
                ) : undefined
              }
              enableColumnVisibility={features?.columnVisibility !== false}
              enableColumnSizing={features?.columnSizing === true}
              enableColumnPinning={features?.columnPinning === true}
              enableRowSelection={features?.rowSelection === true}
              enableGrouping={features?.grouping === true}
              enableExpanding={features?.expanding === true}
              getRowId={getRowId}
            />
          ) : (
            // Vista de cards
            <div className="space-y-4">
              {/* Toggle para volver a tabla */}
              <div className="flex items-center gap-2">
                <ViewToggle viewMode={table.viewMode} onViewModeChange={table.setViewMode} />
              </div>
              <TableCardsView
                data={displayData}
                renderCard={cards?.renderCard || (() => null)}
                gridCols={cards?.gridCols}
                isLoading={isLoading}
                emptyState={defaultEmptyState}
              />
            </div>
          )}
        </QueryLoading>

        {/* Paginación - fuera del contenido */}
        {pagination?.enabled && total > 0 && (
          <TablePagination
            page={table.page}
            pageSize={table.pageSize}
            total={total}
            totalPages={table.totalPages}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            showPageSizeSelector={pagination.showPageSizeSelector}
            pageSizeOptions={pagination.pageSizeOptions}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

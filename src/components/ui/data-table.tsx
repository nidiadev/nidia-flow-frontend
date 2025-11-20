'use client';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnPinningState,
  ColumnSizingState,
  GroupingState,
  ExpandedState,
  RowSelectionState,
  Row,
} from '@tanstack/react-table';
import { useState, ReactNode, useMemo } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { AppLoading } from '@/components/ui/app-loading';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Search,
  Columns,
  Pin,
  PinOff,
  ChevronRight,
  ChevronDown,
  GripVertical,
  X,
  Users,
} from 'lucide-react';

export interface DataTableAction<T> {
  label: string | ((row: T) => string);
  icon?: ReactNode | ((row: T) => ReactNode);
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive' | 'warning';
  separator?: boolean;
  // Permisos granulares: si se especifica, la acción solo se muestra si el usuario tiene el permiso
  requiredPermission?: string | string[]; // Puede ser un permiso o array de permisos (OR logic)
  disabled?: boolean | ((row: T) => boolean);
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  actions?: DataTableAction<T>[];
  pageSize?: number;
  showSearch?: boolean;
  showPagination?: boolean;
  // Advanced features
  enableColumnVisibility?: boolean;
  enableColumnPinning?: boolean;
  enableColumnSizing?: boolean;
  enableGrouping?: boolean;
  enableExpanding?: boolean;
  enableRowSelection?: boolean;
  enableColumnFiltering?: boolean;
  enableFaceting?: boolean;
  onRowSelectionChange?: (selectedRows: T[]) => void;
  defaultColumnVisibility?: VisibilityState;
  defaultColumnPinning?: ColumnPinningState;
  defaultGrouping?: GroupingState;
  getRowId?: (row: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados.',
  emptyDescription,
  isLoading = false,
  onRowClick,
  actions,
  pageSize = 10,
  showSearch = true,
  showPagination = true,
  enableColumnVisibility = true,
  enableColumnPinning = false,
  enableColumnSizing = false,
  enableGrouping = false,
  enableExpanding = false,
  enableRowSelection = false,
  enableColumnFiltering = false,
  enableFaceting = false,
  onRowSelectionChange,
  defaultColumnVisibility,
  defaultColumnPinning,
  defaultGrouping,
  getRowId,
}: DataTableProps<T>) {
  const { hasPermission, hasAnyPermission } = usePermissions();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultColumnVisibility || {});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(defaultColumnPinning || { left: [], right: [] });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [grouping, setGrouping] = useState<GroupingState>(defaultGrouping || []);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Filtrar acciones según permisos
  const filteredActions = useMemo(() => {
    if (!actions) return [];
    
    return actions.filter((action) => {
      // Si no tiene requiredPermission, siempre mostrar
      if (!action.requiredPermission) return true;
      
      // Si es array, verificar si tiene alguno (OR)
      if (Array.isArray(action.requiredPermission)) {
        return hasAnyPermission(action.requiredPermission);
      }
      
      // Si es string, verificar permiso específico
      return hasPermission(action.requiredPermission);
    });
  }, [actions, hasPermission, hasAnyPermission]);

  // Agregar columna de selección si está habilitada
  const tableColumns: ColumnDef<T>[] = [];
  
  if (enableRowSelection) {
    tableColumns.push({
      id: 'select',
      enableHiding: false,
      enableGrouping: false,
      enablePinning: false,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    });
  }
  
  // Agregar columnas normales
  tableColumns.push(...columns);
  
  // Agregar columna de acciones si se proporcionan acciones
  if (filteredActions && filteredActions.length > 0) {
    tableColumns.push({
      id: 'actions',
      enableHiding: false,
      enableGrouping: false,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filteredActions.map((action, index) => {
                // Verificar si la acción está deshabilitada
                const isDisabled = typeof action.disabled === 'function' 
                  ? action.disabled(row.original)
                  : action.disabled || false;
                // Manejar labels e iconos dinámicos si son funciones
                const label = typeof action.label === 'function' 
                  ? action.label(row.original) 
                  : action.label;
                const icon = typeof action.icon === 'function'
                  ? action.icon(row.original)
                  : action.icon;

                const item = (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => !isDisabled && action.onClick(row.original)}
                    disabled={isDisabled}
                    className={
                      action.variant === 'destructive'
                        ? 'text-destructive focus:text-destructive'
                        : action.variant === 'warning'
                        ? 'text-orange-600 focus:text-orange-600'
                        : ''
                    }
                  >
                    {icon && <span className="mr-2">{icon}</span>}
                    {label}
                  </DropdownMenuItem>
                );

                if (action.separator && index < filteredActions.length - 1) {
                  return (
                    <div key={index}>
                      {item}
                      <DropdownMenuSeparator />
                    </div>
                  );
                }

                return item;
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  // Handle row selection changes
  const handleRowSelectionChange = (updater: any) => {
    const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
    setRowSelection(newSelection);
    
    if (onRowSelectionChange && getRowId) {
      const selectedRows = Object.keys(newSelection)
        .filter(key => newSelection[key])
        .map(key => data.find(row => getRowId(row) === key))
        .filter(Boolean) as T[];
      onRowSelectionChange(selectedRows);
    }
  };

  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onRowSelectionChange: enableRowSelection ? handleRowSelectionChange : undefined,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: enableGrouping ? getGroupedRowModel() : undefined,
    getExpandedRowModel: enableExpanding ? getExpandedRowModel() : undefined,
    getFacetedRowModel: enableFaceting ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableFaceting ? getFacetedUniqueValues() : undefined,
    getFacetedMinMaxValues: enableFaceting ? getFacetedMinMaxValues() : undefined,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    enableColumnResizing: enableColumnSizing,
    enableGrouping: enableGrouping,
    enableExpanding: enableExpanding,
    enableRowSelection: enableRowSelection,
    enableColumnFilters: enableColumnFiltering,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      columnPinning,
      columnSizing,
      grouping,
      expanded,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Toolbar: Search and Column Controls */}
      <div className="flex items-center justify-between gap-4">
      {/* Search */}
      {showSearch && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
        </div>
      )}

        {/* Column Visibility Dropdown */}
        {enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const canGroup = enableGrouping && header.column.getCanGroup();
                  const canPin = enableColumnPinning && header.column.getCanPin();
                  const isPinned = enableColumnPinning && (header.column.getIsPinned() === 'left' || header.column.getIsPinned() === 'right');
                  
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        isPinned && 'sticky z-10 bg-background',
                        header.column.getIsPinned() === 'left' && 'left-0',
                        header.column.getIsPinned() === 'right' && 'right-0',
                        enableColumnSizing && header.column.getCanResize() && 'relative'
                      )}
                      style={{
                        width: enableColumnSizing ? header.getSize() : undefined,
                        minWidth: enableColumnSizing ? header.column.columnDef.minSize : undefined,
                        maxWidth: enableColumnSizing ? header.column.columnDef.maxSize : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {/* Grouping indicator */}
                        {canGroup && header.column.getIsGrouped() && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={header.column.getToggleGroupingHandler()}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Expand/Collapse for grouped rows */}
                        {!header.column.getIsGrouped() && canGroup && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={header.column.getToggleGroupingHandler()}
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Column header content */}
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center gap-2">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            
                            {/* Sort indicator */}
                            {canSort && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <ArrowUpDown className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Pin indicator */}
                            {canPin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    {isPinned ? (
                                      <Pin className="h-4 w-4" />
                                    ) : (
                                      <PinOff className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => header.column.pin('left')}
                                    disabled={header.column.getIsPinned() === 'left'}
                                  >
                                    Fijar a la izquierda
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => header.column.pin('right')}
                                    disabled={header.column.getIsPinned() === 'right'}
                                  >
                                    Fijar a la derecha
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => header.column.pin(false)}
                                    disabled={!isPinned}
                                  >
                                    Desfijar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Column resizer */}
                      {enableColumnSizing && header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cn(
                            'absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none bg-border hover:bg-primary/50',
                            header.column.getIsResizing() && 'bg-primary'
                          )}
                        />
                      )}
                  </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                  <AppLoading message="Cargando datos..." fullScreen={false} showLogo={false} />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isGrouped = row.getIsGrouped();
                const isExpanded = row.getIsExpanded();
                const isSelected = enableRowSelection && row.getIsSelected();
                const isPinned = enableColumnPinning && (row.getLeftVisibleCells().some(cell => cell.column.getIsPinned() === 'left') || 
                  row.getRightVisibleCells().some(cell => cell.column.getIsPinned() === 'right'));
                
                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected && 'selected'}
                    className={cn(
                      onRowClick && 'cursor-pointer hover:bg-muted/50 transition-colors',
                      isSelected && 'bg-muted/50',
                      isPinned && 'sticky z-10 bg-background'
                    )}
                    onClick={(e) => {
                      if (!onRowClick) return;
                      // No redirigir si se hace clic en el dropdown, enlaces, checkbox o botones
                      const target = e.target as HTMLElement;
                      if (
                        target.closest('button') ||
                        target.closest('a') ||
                        target.closest('[role="menuitem"]') ||
                        target.closest('[type="checkbox"]') ||
                        target.closest('[role="button"]')
                      ) {
                        return;
                      }
                      onRowClick(row.original);
                    }}
                  >
                    {/* Expand/Collapse for grouped/expandable rows */}
                    {enableExpanding && (isGrouped || row.getCanExpand()) && (
                      <TableCell className="w-12">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            row.toggleExpanded();
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                    
                    {/* Grouped cell */}
                    {isGrouped && (
                      <TableCell
                        colSpan={row.getVisibleCells().length + (enableExpanding ? 0 : 0)}
                        className="font-medium"
                      >
                        <div className="flex items-center gap-2">
                          {row.getGroupingValue(row.groupingColumnId || '') as ReactNode}
                          <span className="text-muted-foreground">
                            ({row.subRows.length} {row.subRows.length === 1 ? 'item' : 'items'})
                          </span>
                        </div>
                      </TableCell>
                    )}
                    
                    {/* Regular cells - row.getVisibleCells() ya incluye la columna de selección si está habilitada */}
                    {!isGrouped && row.getVisibleCells().map((cell) => {
                      const isPinnedCell = enableColumnPinning && 
                        (cell.column.getIsPinned() === 'left' || cell.column.getIsPinned() === 'right');
                      
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            isPinnedCell && 'sticky z-10 bg-background',
                            cell.column.getIsPinned() === 'left' && 'left-0',
                            cell.column.getIsPinned() === 'right' && 'right-0'
                          )}
                          style={{
                            width: enableColumnSizing ? cell.column.getSize() : undefined,
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-64">
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Search className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-base font-medium text-foreground mb-1">{emptyMessage}</p>
                    {emptyDescription && (
                      <p className="text-sm text-muted-foreground max-w-md">{emptyDescription}</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              data.length
            )}{' '}
            de {data.length} resultados
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <div className="text-sm text-muted-foreground">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


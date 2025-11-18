'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Module } from '@/lib/api/modules';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Eye, EyeOff, Edit, Trash2, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { DataTable, DataTableAction } from '@/components/ui/data-table';

interface ModulesTableProps {
  modules: Module[];
  onEdit?: (module: Module) => void;
  onDelete?: (module: Module) => void;
  onViewPlans?: (module: Module) => void;
  onView?: (module: Module) => void;
  isLoading?: boolean;
}

export function ModulesTable({
  modules,
  onEdit,
  onDelete,
  onViewPlans,
  onView,
  isLoading = false,
}: ModulesTableProps) {
  const router = useRouter();
  const actions: DataTableAction<Module>[] = [];

  if (onView) {
    actions.push({
      label: 'Ver detalles',
      icon: Eye,
      onClick: (row) => onView(row),
    });
  }

  if (onViewPlans) {
    actions.push({
      label: 'Ver Planes',
      icon: Package,
      onClick: (row) => onViewPlans(row),
    });
  }

  if (onEdit) {
    actions.push({
      label: 'Editar',
      icon: Edit,
      onClick: (row) => onEdit(row),
      separator: true,
    });
  }

  if (onDelete) {
    actions.push({
      label: 'Eliminar',
      icon: Trash2,
      onClick: (row) => onDelete(row),
      variant: 'destructive',
      separator: true,
    });
  }

  const columns: ColumnDef<Module>[] = [
    {
      accessorKey: 'displayName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Nombre
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {row.original.icon && (
              <span className="text-muted-foreground">{row.original.icon}</span>
            )}
            <span className="font-medium">{row.original.displayName || row.original.name}</span>
          </div>
          {row.original.description && (
            <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'path',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Ruta
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
          {row.original.path}
        </code>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoría',
      cell: ({ row }) => {
        const category = row.original.category;
        return category ? (
          <Badge variant="outline">{category}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Estado
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        const isVisible = row.original.isVisible;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Activo' : 'Inactivo'}
            </Badge>
            {isVisible ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'sortOrder',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Orden
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.sortOrder}</span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Última Actualización
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.original.updatedAt;
        return date ? (
          <span className="text-sm text-muted-foreground">
            {format(new Date(date), 'dd MMM yyyy', { locale: es })}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={modules}
      actions={actions}
      isLoading={isLoading}
      searchPlaceholder="Buscar módulos..."
      onRowClick={(module) => router.push(`/superadmin/modules/${module.id}`)}
    />
  );
}

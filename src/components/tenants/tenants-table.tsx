'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Tenant } from '@/lib/api/tenants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Eye, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { DataTable, DataTableAction } from '@/components/ui/data-table';

interface TenantsTableProps {
  data: Tenant[];
  onView?: (tenant: Tenant) => void;
  onEdit?: (tenant: Tenant) => void;
  onDelete?: (tenant: Tenant) => void;
  onToggleStatus?: (tenant: Tenant) => void;
  isLoading?: boolean;
}

export function TenantsTable({
  data,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  isLoading = false,
}: TenantsTableProps) {
  const router = useRouter();

  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: 'name',
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
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.slug}</span>
        </div>
      ),
    },
    {
      accessorKey: 'planType',
      header: 'Plan',
      cell: ({ row }) => {
        const planType = row.original.planType;
        const planColors: Record<string, string> = {
          free: 'bg-muted text-muted-foreground',
          basic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          professional: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
          enterprise: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        };
        return (
          <Badge
            variant="outline"
            className={planColors[planType] || planColors.free}
          >
            {planType.charAt(0).toUpperCase() + planType.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'billingEmail',
      header: 'Email de Facturación',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.billingEmail}</span>
      ),
    },
    {
      accessorKey: 'currentUsers',
      header: 'Usuarios',
      cell: ({ row }) => {
        const { currentUsers, maxUsers } = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{currentUsers}</span>
            <span className="text-xs text-muted-foreground">/ {maxUsers}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => {
        const { isActive, isSuspended } = row.original;
        if (isSuspended) {
          return (
            <Badge variant="destructive" className="bg-red-500/10 text-red-600 dark:text-red-400">
              Suspendido
            </Badge>
          );
        }
        return (
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={
              isActive
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            }
          >
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Fecha de Creación
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <span className="text-sm text-muted-foreground">
            {format(date, 'dd MMM yyyy', { locale: es })}
          </span>
        );
      },
    },
  ];

  // Preparar acciones para la tabla
  const actions: DataTableAction<Tenant>[] = [];
  
  if (onView) {
    actions.push({
      label: 'Ver detalles',
      icon: <Eye className="h-4 w-4" />,
      onClick: onView,
    });
  }
  
  if (onEdit) {
    actions.push({
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
    });
  }
  
  if (onToggleStatus) {
    actions.push({
      label: (tenant) => tenant.isActive ? 'Desactivar' : 'Activar',
      icon: (tenant) => tenant.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />,
      onClick: onToggleStatus,
      variant: 'warning',
      separator: true,
    });
  }
  
  if (onDelete) {
    actions.push({
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'destructive',
      separator: true,
    });
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Buscar clientes..."
      emptyMessage="No se encontraron clientes."
      emptyDescription="Intenta con otros términos de búsqueda."
      isLoading={isLoading}
      onRowClick={(tenant) => router.push(`/superadmin/tenants/${tenant.id}`)}
      actions={actions}
    />
  );
}


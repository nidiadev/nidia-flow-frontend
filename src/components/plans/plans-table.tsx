'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Plan } from '@/lib/api/plans';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { DataTable, DataTableAction } from '@/components/ui/data-table';

interface PlansTableProps {
  data: Plan[];
  onView?: (plan: Plan) => void;
  onEdit?: (plan: Plan) => void;
  onDelete?: (plan: Plan) => void;
  isLoading?: boolean;
}

export function PlansTable({
  data,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: PlansTableProps) {
  const router = useRouter();

  const columns: ColumnDef<Plan>[] = [
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
          <span className="font-medium">{row.original.displayName}</span>
          <span className="text-xs text-muted-foreground">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'priceMonthly',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Precio Mensual
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const price = row.original.priceMonthly;
        const currency = row.original.currency || 'USD';
        return price ? (
          <span className="font-medium">
            {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: currency,
            }).format(Number(price))}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'priceYearly',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Precio Anual
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const price = row.original.priceYearly;
        const currency = row.original.currency || 'USD';
        return price ? (
          <span className="font-medium">
            {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: currency,
            }).format(Number(price))}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'maxUsers',
      header: 'Límites',
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <div className="flex flex-col gap-1 text-xs">
            {plan.maxUsers && (
              <span className="text-muted-foreground">
                Usuarios: <span className="font-medium">{plan.maxUsers}</span>
              </span>
            )}
            {plan.maxStorageGb && (
              <span className="text-muted-foreground">
                Almacenamiento: <span className="font-medium">{plan.maxStorageGb} GB</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'enabledModules',
      header: 'Módulos',
      cell: ({ row }) => {
        const modules = row.original.enabledModules || [];
        return (
          <div className="flex flex-wrap gap-1">
            {modules.slice(0, 2).map((module) => (
              <Badge key={module} variant="secondary" className="text-xs">
                {module}
              </Badge>
            ))}
            {modules.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{modules.length - 2}
              </Badge>
            )}
            {modules.length === 0 && (
              <span className="text-xs text-muted-foreground">Sin módulos</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        const isVisible = row.original.isVisible;
        return (
          <div className="flex flex-col gap-1">
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={isActive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : ''}
            >
              {isActive ? 'Activo' : 'Inactivo'}
            </Badge>
            {!isVisible && (
              <Badge variant="outline" className="text-xs">
                Oculto
              </Badge>
            )}
          </div>
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
            Creado
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: es })}
          </span>
        );
      },
    },
  ];

  // Preparar acciones para la tabla
  const actions: DataTableAction<Plan>[] = [];
  
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
      searchPlaceholder="Buscar planes..."
      emptyMessage="No se encontraron planes."
      isLoading={isLoading}
      onRowClick={(plan) => router.push(`/superadmin/plans/${plan.id}`)}
      actions={actions}
    />
  );
}


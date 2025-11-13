'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Subscription } from '@/lib/api/subscriptions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Eye, Building2, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { DataTable, DataTableAction } from '@/components/ui/data-table';
import Link from 'next/link';

interface SubscriptionsTableProps {
  data: Subscription[];
  onView?: (subscription: Subscription) => void;
  isLoading?: boolean;
}

export function SubscriptionsTable({
  data,
  onView,
  isLoading = false,
}: SubscriptionsTableProps) {
  const router = useRouter();

  const handleRowClick = (subscription: Subscription) => {
    router.push(`/superadmin/subscriptions/${subscription.id}`);
  };

  const getStatusBadge = (status: string, currentPeriodEnd: string) => {
    const now = new Date();
    const endDate = new Date(currentPeriodEnd);
    const isExpired = endDate < now;

    if (isExpired && status === 'active') {
      return (
        <Badge variant="destructive" className="bg-orange-500/10 text-orange-600 dark:text-orange-400">
          Vencida
        </Badge>
      );
    }

    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      cancelled: 'destructive',
      expired: 'destructive',
      trialing: 'secondary',
      past_due: 'destructive',
    };

    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-600 dark:text-green-400',
      cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
      expired: 'bg-red-500/10 text-red-600 dark:text-red-400',
      trialing: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      past_due: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    };

    return (
      <Badge
        variant={variants[status] || 'outline'}
        className={colors[status] || ''}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const columns: ColumnDef<Subscription>[] = [
    {
      accessorKey: 'tenant',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Cliente
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const tenant = row.original.tenant;
        if (!tenant) return <span className="text-muted-foreground">-</span>;
        return (
          <Link
            href={`/superadmin/tenants/${tenant.id}`}
            className="flex items-center gap-2 hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{tenant.name}</span>
          </Link>
        );
      },
    },
    {
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ row }) => {
        const plan = row.original.plan;
        if (!plan) return <span className="text-muted-foreground">-</span>;
        return (
          <Link
            href={`/superadmin/plans/${plan.id}`}
            className="flex items-center gap-2 hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{plan.displayName}</span>
          </Link>
        );
      },
    },
    {
      accessorKey: 'totalAmount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Monto
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = row.original.totalAmount;
        const currency = row.original.currency || 'USD';
        return (
          <span className="font-medium">
            {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: currency,
            }).format(Number(amount))}
          </span>
        );
      },
    },
    {
      accessorKey: 'billingCycle',
      header: 'Ciclo de Facturación',
      cell: ({ row }) => {
        const cycle = row.original.billingCycle;
        const cycleLabels: Record<string, string> = {
          monthly: 'Mensual',
          yearly: 'Anual',
          quarterly: 'Trimestral',
          semiannually: 'Semestral',
        };
        return (
          <Badge variant="outline">
            {cycleLabels[cycle] || cycle}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        return getStatusBadge(row.original.status, row.original.currentPeriodEnd);
      },
    },
    {
      accessorKey: 'currentPeriodEnd',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Vence
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const endDate = new Date(row.original.currentPeriodEnd);
        const now = new Date();
        const isExpired = endDate < now;
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className={`text-sm ${isExpired ? 'text-destructive' : daysUntilExpiry <= 7 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                {format(endDate, 'dd MMM yyyy', { locale: es })}
              </span>
              {!isExpired && daysUntilExpiry <= 30 && (
                <span className="text-xs text-muted-foreground">
                  {daysUntilExpiry === 0 ? 'Hoy' : daysUntilExpiry === 1 ? 'Mañana' : `En ${daysUntilExpiry} días`}
                </span>
              )}
            </div>
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
            Creada
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
  const actions: DataTableAction<Subscription>[] = [];
  
  if (onView) {
    actions.push({
      label: 'Ver detalles',
      icon: <Eye className="h-4 w-4" />,
      onClick: onView,
    });
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Buscar suscripciones..."
      emptyMessage="No se encontraron suscripciones."
      emptyDescription="Intenta con otros términos de búsqueda o filtros."
      isLoading={isLoading}
      actions={actions}
      onRowClick={handleRowClick}
    />
  );
}


'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Download, Eye, ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useOrderEvents } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { TenantLink } from '@/components/ui/tenant-link';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { useRouter } from 'next/navigation';
import { Table } from '@/components/table';
import { TableRowAction } from '@/components/table/types';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
  };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  assignedTo?: {
    id: string;
    name: string;
  };
}

const statusColors = {
  pending: 'bg-muted text-muted-foreground',
  confirmed: 'bg-nidia-blue/20 text-nidia-blue',
  in_progress: 'bg-nidia-purple/20 text-nidia-purple',
  completed: 'bg-nidia-green/20 text-nidia-green',
  cancelled: 'bg-destructive/20 text-destructive',
};

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  in_progress: 'En Progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

// Define columns for DataTable
function getColumns(): ColumnDef<Order>[] {
  return [
    {
      accessorKey: 'orderNumber',
      header: 'Número',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Cliente',
      cell: ({ row }) => row.original.customer.name,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.status]}>
          {statusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'assignedTo',
      header: 'Asignado a',
      cell: ({ row }) => row.original.assignedTo?.name || 'Sin asignar',
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(row.original.totalAmount)}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString('es-CO')}
        </div>
      ),
    },
  ];
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const { route } = useTenantRoutes();
  const router = useRouter();

  // Listen for real-time order updates
  useOrderEvents(
    () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
    () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
    () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      const response = await api.get(`/orders?${params}`);
      return response.data;
    },
  });

  const orders: Order[] = data?.data || [];
  const pagination = data?.pagination;
  const columns = useMemo(() => getColumns(), []);

  // Row actions
  const rowActions: TableRowAction<Order>[] = useMemo(() => [
    {
      label: 'Ver detalles',
      icon: <Eye className="h-4 w-4" />,
      onClick: (order) => {
        router.push(route(`/orders/${order.id}`));
      },
      requiredPermission: ['orders:read'],
    },
  ], [route, router]);

  // Stats
  const statsData = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending').length;
    const inProgress = orders.filter(o => o.status === 'in_progress' || o.status === 'confirmed').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    return [
      {
        label: 'Total Órdenes',
        value: pagination?.total || orders.length,
        description: 'En el sistema',
        icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" />,
      },
      {
        label: 'Pendientes',
        value: pending,
        description: 'Esperando confirmación',
        icon: <Clock className="h-4 w-4 text-orange-500" />,
      },
      {
        label: 'En Proceso',
        value: inProgress,
        description: 'Confirmadas o en progreso',
        icon: <CheckCircle className="h-4 w-4 text-blue-500" />,
      },
      {
        label: 'Valor Total',
        value: formatCurrency(totalAmount),
        description: 'De esta página',
        icon: <ShoppingCart className="h-4 w-4 text-green-500" />,
      },
    ];
  }, [orders, pagination]);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <SectionHeader
          title="Órdenes"
          description="Gestiona todas las órdenes de venta y servicio"
        />

        <Table
          id="orders"
          data={orders}
          columns={columns}
          search={{
            enabled: true,
            placeholder: 'Buscar por número de orden, cliente...',
          }}
          filters={[
            {
              key: 'status',
              label: 'Estado',
              type: 'select',
              options: [
                { value: 'all', label: 'Todos los estados' },
                { value: 'pending', label: 'Pendiente' },
                { value: 'confirmed', label: 'Confirmada' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'completed', label: 'Completada' },
                { value: 'cancelled', label: 'Cancelada' },
              ],
            },
          ]}
          onFiltersChange={(filters) => {
            if (filters.status !== undefined) setStatusFilter(filters.status);
          }}
          pagination={{
            enabled: true,
            pageSize: limit,
            serverSide: true,
            total: pagination?.total,
            onPageChange: (newPage) => setPage(newPage),
          }}
          rowActions={rowActions}
          actions={[
            {
              label: 'Exportar',
              icon: <Download className="h-4 w-4" />,
              variant: 'outline',
              onClick: () => {},
            },
            ...((hasPermission('orders:write') || hasPermission('orders:create')) ? [{
              label: 'Nueva Orden',
              icon: <Plus className="h-4 w-4" />,
              onClick: () => router.push(route('/orders/new')),
            }] : []),
          ]}
          stats={{
            enabled: true,
            stats: statsData,
          }}
          emptyState={{
            icon: <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />,
            title: 'No se encontraron órdenes',
            description: 'Intenta con otros términos de búsqueda o filtros',
            action: (hasPermission('orders:write') || hasPermission('orders:create')) ? (
              <Button asChild>
                <TenantLink href={route('/orders/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Orden
                </TenantLink>
              </Button>
            ) : undefined,
          }}
          isLoading={isLoading}
          isError={!!error}
          error={error as Error | null}
          onRetry={refetch}
          features={{
            columnVisibility: true,
            columnSizing: true,
          }}
          getRowId={(row) => row.id}
        />
      </div>
    </ErrorBoundary>
  );
}

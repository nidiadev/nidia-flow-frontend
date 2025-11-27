'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle,
  Package,
  TrendingDown,
  XCircle,
  Eye
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { stockAlertsApi, StockAlert } from '@/lib/api/products';
import { Table } from '@/components/table';
import { TableRowAction } from '@/components/table/types';

// Define columns for DataTable
function getColumns(): ColumnDef<StockAlert>[] {
  return [
    {
      accessorKey: 'productName',
      header: 'Producto',
      cell: ({ row }) => {
        const alert = row.original;
        const isOutOfStock = alert.alertType === 'out_of_stock';
        return (
          <div className="flex items-center space-x-2">
            {isOutOfStock ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            )}
            <div>
              <div className="font-medium">{alert.product?.name || 'Producto sin nombre'}</div>
              {alert.product?.sku && (
                <div className="text-sm text-muted-foreground">SKU: {alert.product.sku}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'alertType',
      header: 'Tipo de Alerta',
      cell: ({ row }) => {
        const isOutOfStock = row.original.alertType === 'out_of_stock';
        return (
          <Badge variant={isOutOfStock ? 'destructive' : 'warning'}>
            {isOutOfStock ? 'Sin Stock' : 'Stock Bajo'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'currentStock',
      header: 'Stock Actual',
      cell: ({ row }) => {
        const alert = row.original;
        const isOutOfStock = alert.alertType === 'out_of_stock';
        return (
          <div className={isOutOfStock ? 'text-red-600 font-medium' : 'text-orange-600 font-medium'}>
            {alert.currentStock} unidades
          </div>
        );
      },
    },
    {
      accessorKey: 'minStock',
      header: 'Stock Mínimo',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.minStock} unidades
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      ),
    },
    {
      accessorKey: 'isResolved',
      header: 'Estado',
      cell: ({ row }) => {
        const isResolved = row.original.isResolved;
        return isResolved ? (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resuelta
          </Badge>
        ) : (
          <Badge variant="secondary">Pendiente</Badge>
        );
      },
    },
  ];
}

export default function StockAlertsPage() {
  const { isOffline } = useNetworkStatus();
  const { route } = useTenantRoutes();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Build filters
  const filters = useMemo(() => ({
    page,
    limit,
    isResolved: statusFilter === 'pending' ? false : statusFilter === 'resolved' ? true : undefined,
    alertType: alertTypeFilter !== 'all' ? alertTypeFilter as 'low_stock' | 'out_of_stock' : undefined,
  }), [statusFilter, alertTypeFilter, page, limit]);

  // Fetch alerts
  const { data: alertsData, isLoading, error, refetch } = useQuery({
    queryKey: ['stock-alerts', filters],
    queryFn: async () => {
      const response = await stockAlertsApi.getAll(filters);
      return response;
    },
  });

  // Resolve/Unresolve mutations
  const resolveMutation = useMutation({
    mutationFn: async (id: string) => stockAlertsApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      toast.success('Alerta marcada como resuelta');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al resolver la alerta');
    },
  });

  const unresolveMutation = useMutation({
    mutationFn: async (id: string) => stockAlertsApi.unresolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      toast.success('Alerta marcada como pendiente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar la alerta');
    },
  });

  const alerts = alertsData?.data?.data || [];
  const pagination = alertsData?.data?.pagination;
  const columns = useMemo(() => getColumns(), []);

  // Row actions
  const rowActions: TableRowAction<StockAlert>[] = useMemo(() => [
    {
      label: 'Ver Producto',
      icon: <Eye className="h-4 w-4" />,
      onClick: (alert) => {
        if (alert.productId) {
          router.push(route(`/products/catalog/${alert.productId}`));
        }
      },
    },
    {
      label: (alert) => alert.isResolved ? 'Marcar como Pendiente' : 'Resolver',
      icon: (alert) => alert.isResolved ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
      onClick: (alert) => {
        if (alert.isResolved) {
          unresolveMutation.mutate(alert.id);
        } else {
          resolveMutation.mutate(alert.id);
        }
      },
      separator: true,
    },
  ], [resolveMutation, unresolveMutation, route, router]);

  // Stats
  const statsData = useMemo(() => {
    const pending = alerts.filter((a: StockAlert) => !a.isResolved);
    const outOfStock = pending.filter((a: StockAlert) => a.alertType === 'out_of_stock');
    const lowStock = pending.filter((a: StockAlert) => a.alertType === 'low_stock');
    
    return [
      {
        label: 'Alertas Pendientes',
        value: pending.length,
        description: 'Requieren atención',
        icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
      },
      {
        label: 'Sin Stock',
        value: outOfStock.length,
        description: 'Productos agotados',
        icon: <XCircle className="h-4 w-4 text-red-500" />,
      },
      {
        label: 'Stock Bajo',
        value: lowStock.length,
        description: 'Cerca del mínimo',
        icon: <TrendingDown className="h-4 w-4 text-orange-500" />,
      },
    ];
  }, [alerts]);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <SectionHeader
          title="Alertas de Stock"
          description="Productos que requieren reabastecimiento"
          actions={
            isOffline ? (
              <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Modo Offline</span>
              </div>
            ) : null
          }
        />

        <Table
          id="stock-alerts"
          data={alerts}
          columns={columns}
          search={{
            enabled: true,
            placeholder: 'Buscar alertas...',
          }}
          filters={[
            {
              key: 'status',
              label: 'Estado',
              type: 'select',
              options: [
                { value: 'all', label: 'Todas las alertas' },
                { value: 'pending', label: 'Pendientes' },
                { value: 'resolved', label: 'Resueltas' },
              ],
            },
            {
              key: 'alertType',
              label: 'Tipo',
              type: 'select',
              options: [
                { value: 'all', label: 'Todos los tipos' },
                { value: 'low_stock', label: 'Stock Bajo' },
                { value: 'out_of_stock', label: 'Sin Stock' },
              ],
            },
          ]}
          onFiltersChange={(filters) => {
            if (filters.status !== undefined) setStatusFilter(filters.status);
            if (filters.alertType !== undefined) setAlertTypeFilter(filters.alertType);
          }}
          pagination={{
            enabled: true,
            pageSize: limit,
            serverSide: true,
            total: pagination?.total,
            onPageChange: (newPage) => setPage(newPage),
          }}
          rowActions={rowActions}
          stats={{
            enabled: true,
            stats: statsData,
          }}
          emptyState={{
            icon: <CheckCircle className="h-16 w-16 text-green-500/50" />,
            title: 'No hay alertas de stock',
            description: statusFilter === 'pending' 
              ? '¡Excelente! Todos tus productos tienen stock suficiente'
              : 'No hay alertas resueltas en este momento',
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

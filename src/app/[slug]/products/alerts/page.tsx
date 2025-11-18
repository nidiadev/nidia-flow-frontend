'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  CheckCircle,
  Package,
  TrendingDown,
  XCircle,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageHeader } from '@/components/ui/page-header';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { toast } from 'sonner';
import { StockAlert } from '@/types/product';
import { DataTable, DataTableAction } from '@/components/ui/data-table';

// Mock data
const mockAlerts: StockAlert[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Laptop Dell XPS 15',
    productSku: 'LAP-001',
    currentStock: 2,
    minStock: 5,
    alertType: 'low_stock',
    isResolved: false,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    productId: '2',
    productName: 'Mouse Logitech MX Master',
    productSku: 'MOU-001',
    currentStock: 0,
    minStock: 10,
    alertType: 'out_of_stock',
    isResolved: false,
    createdAt: '2024-01-14T10:00:00Z',
  },
  {
    id: '3',
    productId: '3',
    productName: 'Teclado Mecánico RGB',
    productSku: 'KEY-001',
    currentStock: 3,
    minStock: 8,
    alertType: 'low_stock',
    isResolved: false,
    createdAt: '2024-01-13T10:00:00Z',
  },
  {
    id: '4',
    productId: '4',
    productName: 'Monitor LG 27"',
    productSku: 'MON-001',
    currentStock: 0,
    minStock: 5,
    alertType: 'out_of_stock',
    isResolved: true,
    resolvedAt: '2024-01-12T10:00:00Z',
    createdAt: '2024-01-10T10:00:00Z',
  },
];

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
              <div className="font-medium">{alert.productName}</div>
              <div className="text-sm text-muted-foreground">SKU: {alert.productSku}</div>
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
      cell: ({ row }) => {
        return (
          <div className="text-sm text-muted-foreground">
            {row.original.minStock} unidades
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => {
        return (
          <div className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString('es-ES')}
          </div>
        );
      },
    },
    {
      accessorKey: 'isResolved',
      header: 'Estado',
      cell: ({ row }) => {
        const isResolved = row.original.isResolved;
        return isResolved ? (
          <Badge variant="success">
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
  const [statusFilter, setStatusFilter] = useState('pending');
  
  const alerts = mockAlerts;
  const columns = useMemo(() => getColumns(), []);
  
  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (statusFilter === 'pending') return !alert.isResolved;
      if (statusFilter === 'resolved') return alert.isResolved;
      return true;
    });
  }, [alerts, statusFilter]);

  // Actions for DataTable
  const actions: DataTableAction<StockAlert>[] = [
    {
      label: 'Ver Producto',
      icon: <Eye className="h-4 w-4" />,
      onClick: (alert) => {
        window.location.href = `/products/catalog/${alert.productId}`;
      },
    },
    {
      label: (alert) => alert.isResolved ? 'Marcar como Pendiente' : 'Resolver',
      icon: (alert) => alert.isResolved ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
      onClick: (alert) => {
        if (alert.isResolved) {
          toast.info('Alerta marcada como pendiente');
        } else {
          toast.success('Alerta marcada como resuelta');
        }
      },
      separator: true,
    },
  ];

  const pendingAlerts = alerts.filter(a => !a.isResolved);
  const outOfStockAlerts = pendingAlerts.filter(a => a.alertType === 'out_of_stock');
  const lowStockAlerts = pendingAlerts.filter(a => a.alertType === 'low_stock');

  return (
    <ErrorBoundary>
      <div>
        <PageHeader
          title="Alertas de Stock"
          description="Productos que requieren reabastecimiento"
          variant="gradient"
          actions={
            isOffline && (
              <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Modo Offline</span>
              </div>
            )
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Pendientes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingAlerts.length}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockAlerts.length}</div>
              <p className="text-xs text-muted-foreground">
                Productos agotados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStockAlerts.length}</div>
              <p className="text-xs text-muted-foreground">
                Cerca del mínimo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las alertas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="resolved">Resueltas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
            <CardDescription>
              Productos que requieren atención por stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredAlerts}
              columns={columns}
              searchPlaceholder="Buscar alertas..."
              emptyMessage="No hay alertas"
              emptyDescription={
                statusFilter === 'pending' 
                  ? 'Todos los productos tienen stock suficiente'
                  : 'No hay alertas resueltas'
              }
              actions={actions}
              enableColumnVisibility={true}
              enableColumnSizing={true}
              getRowId={(row) => row.id}
            />
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

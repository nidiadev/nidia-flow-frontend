'use client';

import { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertTriangle, 
  CheckCircle,
  Package,
  TrendingDown,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { toast } from 'sonner';
import { StockAlert } from '@/types/product';

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

// Alert row component
function AlertRow({ alert }: { alert: StockAlert }) {
  const isOutOfStock = alert.alertType === 'out_of_stock';
  
  const handleResolve = () => {
    toast.success('Alerta marcada como resuelta');
  };

  return (
    <TableRow className={alert.isResolved ? 'opacity-50' : ''}>
      <TableCell>
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
      </TableCell>
      
      <TableCell>
        <Badge variant={isOutOfStock ? 'destructive' : 'warning'}>
          {isOutOfStock ? 'Sin Stock' : 'Stock Bajo'}
        </Badge>
      </TableCell>
      
      <TableCell>
        <div className={isOutOfStock ? 'text-red-600 font-medium' : 'text-orange-600 font-medium'}>
          {alert.currentStock} unidades
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {alert.minStock} unidades
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {new Date(alert.createdAt).toLocaleDateString('es-ES')}
        </div>
      </TableCell>
      
      <TableCell>
        {alert.isResolved ? (
          <Badge variant="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resuelta
          </Badge>
        ) : (
          <Badge variant="secondary">Pendiente</Badge>
        )}
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            asChild
          >
            <Link href={`/products/catalog/${alert.productId}`}>
              Ver Producto
            </Link>
          </Button>
          
          {!alert.isResolved && (
            <Button 
              size="sm" 
              variant="default"
              onClick={handleResolve}
            >
              Resolver
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function StockAlertsPage() {
  const { isOffline } = useNetworkStatus();
  const [statusFilter, setStatusFilter] = useState('pending');
  
  const alerts = mockAlerts;
  
  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (statusFilter === 'pending') return !alert.isResolved;
    if (statusFilter === 'resolved') return alert.isResolved;
    return true;
  });

  const pendingAlerts = alerts.filter(a => !a.isResolved);
  const outOfStockAlerts = pendingAlerts.filter(a => a.alertType === 'out_of_stock');
  const lowStockAlerts = pendingAlerts.filter(a => a.alertType === 'low_stock');

  return (
    <ErrorBoundary>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">
              Alertas de Stock
            </h1>
            <p className="text-muted-foreground">
              Productos que requieren reabastecimiento
            </p>
          </div>
          
          {isOffline && (
            <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Modo Offline</span>
            </div>
          )}
        </div>

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
              {filteredAlerts.length} alerta{filteredAlerts.length !== 1 ? 's' : ''} encontrada{filteredAlerts.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay alertas</h3>
                <p className="text-muted-foreground">
                  {statusFilter === 'pending' 
                    ? 'Todos los productos tienen stock suficiente'
                    : 'No hay alertas resueltas'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo de Alerta</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Stock Mínimo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <AlertRow key={alert.id} alert={alert} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, TrendingDown, AlertTriangle, DollarSign, Layers, Grid3x3, ArrowUpDown } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { QueryLoading } from '@/components/ui/loading';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { useRouter } from 'next/navigation';
import { productsApi, stockAlertsApi, ProductStats } from '@/lib/api/products';
import { TenantLink } from '@/components/ui/tenant-link';

// Product Stats Component
function ProductStatsCards({ stats, isLoading }: { stats?: ProductStats; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProducts || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeProducts || 0} activos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.lowStockCount || 0}</div>
          <p className="text-xs text-muted-foreground">Requieren reabastecimiento</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.outOfStockCount || 0}</div>
          <p className="text-xs text-muted-foreground">Productos agotados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${(stats.totalInventoryValue || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Valor total en stock</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Quick Actions Component
function QuickActions() {
  const router = useRouter();
  const { isOffline } = useNetworkStatus();
  const { route } = useTenantRoutes();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>
          Acciones comunes para gestión de productos
          {isOffline && (
            <span className="block text-orange-600 text-xs mt-1">
              ⚠️ Modo offline - Algunas funciones limitadas
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => router.push(route('/products/catalog'))}
        >
          <Package className="mr-2 h-4 w-4" />
          Ver Catálogo Completo
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => router.push(route('/products/catalog/new'))}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Nuevo Producto
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => router.push(route('/products/categories'))}
        >
          <Layers className="mr-2 h-4 w-4" />
          Gestionar Categorías
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => router.push(route('/products/alerts'))}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Ver Alertas de Stock
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => router.push(route('/products/variants'))}
        >
          <Grid3x3 className="mr-2 h-4 w-4" />
          Gestionar Variantes
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => router.push(route('/products/pricing'))}
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Gestión de Precios
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => router.push(route('/products/inventory'))}
        >
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Movimientos de Inventario
        </Button>
      </CardContent>
    </Card>
  );
}

// Recent Alerts Component
function RecentAlerts() {
  const router = useRouter();
  const { route } = useTenantRoutes();
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['stock-alerts', 'recent'],
    queryFn: async () => {
      const response = await stockAlertsApi.getAll({ limit: 5, isResolved: false });
      return response;
    },
  });

  const alerts = alertsData?.data?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas Recientes</CardTitle>
          <CardDescription>Productos que requieren atención</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas Recientes</CardTitle>
        <CardDescription>
          Productos que requieren atención
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay alertas pendientes</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {alerts.map((alert: any) => {
                const isOutOfStock = alert.alertType === 'out_of_stock';
                return (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      isOutOfStock
                        ? 'border-red-200 bg-red-50 dark:bg-red-900/10'
                        : 'border-orange-200 bg-orange-50 dark:bg-orange-900/10'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {alert.product?.name || 'Producto sin nombre'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {alert.currentStock} unidades
                        {alert.minStock && ` (mínimo: ${alert.minStock})`}
                      </p>
                    </div>
                    <AlertTriangle
                      className={`h-5 w-5 ${
                        isOutOfStock ? 'text-red-600' : 'text-orange-600'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => router.push(route('/products/alerts'))}
            >
              Ver Todas las Alertas
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProductsPage() {
  const { isOffline } = useNetworkStatus();
  const { route } = useTenantRoutes();

  // Fetch product statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['product-stats'],
    queryFn: async () => {
      const response = await productsApi.getStats();
      return response;
    },
  });

  const stats = statsData?.data;

  return (
    <ErrorBoundary>
      <div>
        <SectionHeader
          title="Productos"
          description="Gestiona tu catálogo de productos y servicios"
          actions={
            <>
              {isOffline && (
                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Modo Offline</span>
                </div>
              )}
              <Button asChild>
                <TenantLink href={route('/products/catalog/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </TenantLink>
              </Button>
            </>
          }
        />

        <ProductStatsCards stats={stats} isLoading={statsLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions />
          <RecentAlerts />
        </div>
      </div>
    </ErrorBoundary>
  );
}

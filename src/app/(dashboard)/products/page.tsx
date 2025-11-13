'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, TrendingDown, AlertTriangle, DollarSign, Layers } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useNetworkStatus } from '@/hooks/use-network-status';

// Mock stats component
function ProductStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">156</div>
          <p className="text-xs text-muted-foreground">142 activos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">12</div>
          <p className="text-xs text-muted-foreground">Requieren reabastecimiento</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">3</div>
          <p className="text-xs text-muted-foreground">Productos agotados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$45,230</div>
          <p className="text-xs text-muted-foreground">Valor total en stock</p>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickActions() {
  const { isOffline } = useNetworkStatus();

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
          onClick={() => window.location.href = '/products/catalog'}
        >
          <Package className="mr-2 h-4 w-4" />
          Ver Catálogo Completo
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => window.location.href = '/products/catalog/new'}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Nuevo Producto
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => window.location.href = '/products/categories'}
        >
          <Layers className="mr-2 h-4 w-4" />
          Gestionar Categorías
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => window.location.href = '/products/alerts'}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Ver Alertas de Stock
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => window.location.href = '/products/inventory'}
        >
          <Package className="mr-2 h-4 w-4" />
          Movimientos de Inventario
        </Button>
      </CardContent>
    </Card>
  );
}

function RecentAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas Recientes</CardTitle>
        <CardDescription>
          Productos que requieren atención
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg border-orange-200 bg-orange-50">
            <div>
              <p className="font-medium text-sm">Laptop Dell XPS 15</p>
              <p className="text-xs text-muted-foreground">Stock: 2 unidades (mínimo: 5)</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
            <div>
              <p className="font-medium text-sm">Mouse Logitech MX Master</p>
              <p className="text-xs text-muted-foreground">Stock: 0 unidades</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg border-orange-200 bg-orange-50">
            <div>
              <p className="font-medium text-sm">Teclado Mecánico RGB</p>
              <p className="text-xs text-muted-foreground">Stock: 3 unidades (mínimo: 8)</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
        </div>

        <Button 
          className="w-full mt-4" 
          variant="outline"
          onClick={() => window.location.href = '/products/alerts'}
        >
          Ver Todas las Alertas
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ProductsPage() {
  const { isOffline } = useNetworkStatus();

  return (
    <ErrorBoundary>
      <div>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">
                Productos
              </h1>
              <p className="text-muted-foreground">
                Gestiona tu catálogo de productos y servicios
              </p>
            </div>
            
            {isOffline && (
              <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Modo Offline</span>
              </div>
            )}
          </div>
        </div>

        <ProductStats />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions />
          <RecentAlerts />
        </div>
      </div>
    </ErrorBoundary>
  );
}

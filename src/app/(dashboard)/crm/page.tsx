'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, TrendingUp, MessageSquare, Plus } from 'lucide-react';
import { useCustomers, useCreateCustomer } from '@/hooks/use-api';
import { QueryLoading, LoadingSpinner, CardSkeleton, LoadingButton } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useState } from 'react';
import { toast } from 'sonner';

// Demo component to show loading states and error handling
function CustomerStats() {
  const { data: customers, isLoading, isError, error, refetch } = useCustomers();
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Error al cargar estadísticas</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats from real data
  const totalCustomers = customers?.length || 0;
  const activeLeads = customers?.filter((c: any) => c.type === 'lead')?.length || 0;
  const conversionRate = totalCustomers > 0 ? ((customers?.filter((c: any) => c.type === 'active')?.length || 0) / totalCustomers * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Clientes registrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leads Activos</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeLeads}</div>
          <p className="text-xs text-muted-foreground">En proceso de conversión</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">Leads a clientes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interacciones</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">456</div>
          <p className="text-xs text-muted-foreground">Esta semana</p>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentCustomers() {
  const { data: customers, isLoading, isError, error, refetch } = useCustomers({ 
    limit: 5, 
    sortBy: 'createdAt', 
    sortOrder: 'desc' 
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes Recientes</CardTitle>
        <CardDescription>
          Últimos clientes registrados en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={!customers || customers.length === 0}
          onRetry={refetch}
          loadingFallback={
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          }
          emptyFallback={
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay clientes registrados</p>
              <p className="text-sm text-muted-foreground mt-1">
                Comienza agregando tu primer cliente
              </p>
            </div>
          }
        >
          <div className="space-y-4">
            {customers?.map((customer: any, index: number) => (
              <div key={customer.id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customer.companyName || customer.email}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium capitalize">
                    {customer.type || 'Cliente'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Score: {customer.leadScore || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </QueryLoading>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const [isCreating, setIsCreating] = useState(false);
  const createCustomer = useCreateCustomer();
  const { isOffline } = useNetworkStatus();

  const handleCreateDemoCustomer = async () => {
    if (isOffline) {
      toast.error('No hay conexión. Esta acción requiere internet.');
      return;
    }

    setIsCreating(true);
    try {
      await createCustomer.mutateAsync({
        firstName: 'Cliente',
        lastName: 'Demo',
        email: `demo${Date.now()}@example.com`,
        type: 'lead',
        leadScore: Math.floor(Math.random() * 100),
        companyName: 'Empresa Demo',
      });
      toast.success('Cliente demo creado exitosamente');
    } catch (error) {
      // Error is handled by the mutation hook
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>
          Acciones comunes para gestión de CRM
          {isOffline && (
            <span className="block text-orange-600 text-xs mt-1">
              ⚠️ Modo offline - Algunas funciones limitadas
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoadingButton
          loading={isCreating}
          onClick={handleCreateDemoCustomer}
          className="w-full justify-start"
          variant="outline"
          disabled={isOffline}
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear Cliente Demo
        </LoadingButton>
        
        <Button className="w-full justify-start" variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Agregar Nuevo Cliente
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => window.location.href = '/crm/customers'}
        >
          <Users className="mr-2 h-4 w-4" />
          Ver Lista de Clientes
        </Button>
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => window.location.href = '/crm/pipeline'}
        >
          <Users className="mr-2 h-4 w-4" />
          Ver Pipeline de Ventas
        </Button>
        
        <Button className="w-full justify-start" variant="outline">
          <MessageSquare className="mr-2 h-4 w-4" />
          Registrar Interacción
        </Button>
        
        <Button className="w-full justify-start" variant="outline">
          <TrendingUp className="mr-2 h-4 w-4" />
          Ver Reportes de Ventas
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CRMPage() {
  const { isOffline } = useNetworkStatus();

  return (
    <ErrorBoundary>
      <div>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">
                CRM
              </h1>
              <p className="text-muted-foreground">
                Gestiona tus clientes, leads y pipeline de ventas
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

        <CustomerStats />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions />
          <RecentCustomers />
        </div>
      </div>
    </ErrorBoundary>
  );
}
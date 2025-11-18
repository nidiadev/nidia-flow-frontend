'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { SubscriptionsTable } from '@/components/subscriptions/subscriptions-table';
import { subscriptionsApi, Subscription } from '@/lib/api/subscriptions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

export default function SubscriptionsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Fetch subscriptions with filters - actualización en tiempo real
  const { data, isLoading, error } = useQuery({
    queryKey: ['subscriptions', statusFilter],
    queryFn: () => subscriptionsApi.list({ status: statusFilter, limit: 50 }),
    retry: 1,
    retryOnMount: false,
    refetchInterval: 5000, // Refrescar cada 5 segundos para actualización en tiempo real
    refetchOnWindowFocus: true, // Refrescar cuando la ventana recupera el foco
  });

  const subscriptions = data?.data || [];
  const pagination = data?.pagination || {};

  const handleView = (subscription: Subscription) => {
    router.push(`/superadmin/subscriptions/${subscription.id}`);
  };

  const getActiveCount = () => {
    // Esto se puede optimizar con un endpoint de estadísticas
    return subscriptions.filter((s) => {
      const endDate = new Date(s.currentPeriodEnd);
      return s.status === 'active' && endDate >= new Date();
    }).length;
  };

  const getExpiredCount = () => {
    return subscriptions.filter((s) => {
      const endDate = new Date(s.currentPeriodEnd);
      return s.status === 'active' && endDate < new Date();
    }).length;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Suscripciones"
        description="Gestiona todas las suscripciones de los clientes"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Suscripciones</CardTitle>
              <CardDescription>
                Todas las suscripciones de los clientes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4" onValueChange={(value) => {
            if (value === 'all') {
              setStatusFilter(undefined);
            } else if (value === 'active') {
              setStatusFilter('active');
            } else if (value === 'expired') {
              // Para expired, necesitamos filtrar por fecha, no por status
              setStatusFilter(undefined);
            } else {
              setStatusFilter(value);
            }
          }}>
            <TabsList>
              <TabsTrigger value="all">
                Todas
                {subscriptions.length > 0 && (
                  <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                    {subscriptions.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="active">
                Activas
                {getActiveCount() > 0 && (
                  <span className="ml-2 text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                    {getActiveCount()}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="expired">
                Vencidas
                {getExpiredCount() > 0 && (
                  <span className="ml-2 text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                    {getExpiredCount()}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Canceladas
                {subscriptions.filter((s) => s.status === 'cancelled').length > 0 && (
                  <span className="ml-2 text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                    {subscriptions.filter((s) => s.status === 'cancelled').length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <TableSkeleton rows={5} columns={6} />
              ) : error ? (
                <div className="text-center py-12 text-destructive">
                  <p>Error al cargar las suscripciones</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {error instanceof Error ? error.message : 'Error desconocido'}
                  </p>
                </div>
              ) : (
                <SubscriptionsTable
                  data={subscriptions}
                  onView={handleView}
                  isLoading={isLoading}
                />
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <SubscriptionsTable
                  data={subscriptions.filter((s) => {
                    const endDate = new Date(s.currentPeriodEnd);
                    return s.status === 'active' && endDate >= new Date();
                  })}
                  onView={handleView}
                  isLoading={isLoading}
                />
              )}
            </TabsContent>

            <TabsContent value="expired" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <SubscriptionsTable
                  data={subscriptions.filter((s) => {
                    const endDate = new Date(s.currentPeriodEnd);
                    return s.status === 'active' && endDate < new Date();
                  })}
                  onView={handleView}
                  isLoading={isLoading}
                />
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <SubscriptionsTable
                  data={subscriptions.filter((s) => s.status === 'cancelled')}
                  onView={handleView}
                  isLoading={isLoading}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}


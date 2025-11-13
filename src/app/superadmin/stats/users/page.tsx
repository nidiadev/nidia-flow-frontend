'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowLeft, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { tenantsApi } from '@/lib/api/tenants';

export default function UsersStatsPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => tenantsApi.getDashboardStats(),
    retry: 1,
    retryOnMount: false,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Error al cargar estadísticas de usuarios</p>
        <p className="text-sm mt-2 text-muted-foreground">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link href="/superadmin/stats/overview">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Estadísticas
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estadísticas de Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis de usuarios y crecimiento
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            {stats?.usersChange !== undefined && stats.usersChange !== 0 && (
              <div className="flex items-center text-xs mt-1">
                {stats.usersChange > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingUp className="h-3 w-3 mr-1 text-red-500 rotate-180" />
                )}
                <span className={stats.usersChange > 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(stats.usersChange)}%
                </span>
                <span className="ml-1 text-muted-foreground">vs mes anterior</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Clientes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats?.activeTenants || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              De {stats?.totalTenants || 0} totales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Suscripciones Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Suscripciones vigentes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribución por Estado de Plan</CardTitle>
          <CardDescription>
            Clientes agrupados por estado de suscripción
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.tenantsByPlanStatus && Object.keys(stats.tenantsByPlanStatus).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(stats.tenantsByPlanStatus).map(([status, count]: [string, any]) => (
                <div key={status} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium capitalize">{status}</span>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay datos disponibles
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}


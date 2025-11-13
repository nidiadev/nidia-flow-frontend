'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Users, Building2, CreditCard, DollarSign, Loader2 } from 'lucide-react';
import { tenantsApi } from '@/lib/api/tenants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function StatsOverviewPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => tenantsApi.getDashboardStats(),
    retry: 1,
    retryOnMount: false,
    refetchInterval: 30000, // Refrescar cada 30 segundos
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
        <p>Error al cargar estadísticas</p>
        <p className="text-sm mt-2 text-muted-foreground">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-outfit mb-2 text-foreground">
          Estadísticas Generales
        </h1>
        <p className="text-muted-foreground text-lg">
          Resumen completo del sistema
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats?.tenantsChange !== undefined && stats.tenantsChange !== 0 && (
                <>
                  {stats.tenantsChange > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  <span className={stats.tenantsChange > 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(stats.tenantsChange)}%
                  </span>
                  <span className="ml-1">vs mes anterior</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats?.revenueChange !== undefined && stats.revenueChange !== 0 && (
                <>
                  {stats.revenueChange > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  <span className={stats.revenueChange > 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(stats.revenueChange)}%
                  </span>
                  <span className="ml-1">vs mes anterior</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats?.usersChange !== undefined && stats.usersChange !== 0 && (
                <>
                  {stats.usersChange > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  <span className={stats.usersChange > 0 ? 'text-green-500' : 'text-red-500'}>
                    {Math.abs(stats.usersChange)}%
                  </span>
                  <span className="ml-1">vs mes anterior</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Suscripciones vigentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de ingresos */}
      {stats?.revenueByMonth && stats.revenueByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Mes (Últimos 6 Meses)</CardTitle>
            <CardDescription>
              Evolución de ingresos y nuevos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'revenue') {
                      return [formatCurrency(value), 'Ingresos'];
                    }
                    return [value, 'Clientes'];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Ingresos" />
                <Bar yAxisId="right" dataKey="clientes" fill="#3b82f6" name="Nuevos Clientes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Clientes recientes */}
      {stats?.recentTenants && stats.recentTenants.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Clientes Recientes</CardTitle>
                <CardDescription>
                  Últimos clientes registrados en el sistema
                </CardDescription>
              </div>
              <Link href="/superadmin/tenants">
                <Button variant="outline" size="sm">
                  Ver todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTenants.map((tenant: any) => (
                <div key={tenant.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(tenant.createdAt), 'PP', { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tenant.isActive && !tenant.isSuspended
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {tenant.isActive && !tenant.isSuspended ? 'Activo' : 'Inactivo'}
                    </span>
                    <Link href={`/superadmin/tenants/${tenant.id}`}>
                      <Button variant="ghost" size="sm">Ver</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enlaces rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/superadmin/stats/revenue">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Análisis detallado de ingresos y facturación
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/superadmin/stats/users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Estadísticas de usuarios y crecimiento
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/superadmin/stats/reports">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reportes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Genera y descarga reportes detallados
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </motion.div>
  );
}


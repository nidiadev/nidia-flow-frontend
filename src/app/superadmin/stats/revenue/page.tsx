'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowLeft, DollarSign, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCardSkeleton, ChartSkeleton } from '@/components/ui/loading';
import Link from 'next/link';
import { tenantsApi } from '@/lib/api/tenants';
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

export default function RevenueStatsPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => tenantsApi.getDashboardStats(),
    retry: 1,
    retryOnMount: false,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calcular ingresos anuales (suma de los últimos 12 meses)
  const annualRevenue = stats?.revenueByMonth
    ? stats.revenueByMonth.reduce((sum: number, month: any) => sum + (month.revenue || 0), 0)
    : 0;

  // Calcular promedio mensual
  const averageMonthly = stats?.revenueByMonth && stats.revenueByMonth.length > 0
    ? annualRevenue / stats.revenueByMonth.length
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link href="/superadmin/stats/overview">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Estadísticas
          </Button>
        </Link>
        <PageHeader
          title="Estadísticas de Ingresos"
          description="Análisis de ingresos y facturación"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton height={300} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Error al cargar estadísticas de ingresos</p>
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
      <Link href="/superadmin/stats/overview">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Estadísticas
        </Button>
      </Link>
      
      <PageHeader
        title="Estadísticas de Ingresos"
        description="Análisis detallado de ingresos y facturación"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ingresos Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            {stats?.revenueChange !== undefined && stats.revenueChange !== 0 && (
              <p className={`text-xs mt-1 ${stats.revenueChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.revenueChange > 0 ? '+' : ''}{stats.revenueChange}% vs mes anterior
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ingresos (Últimos 6 Meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(annualRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Suma de los últimos 6 meses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Promedio Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageMonthly)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio de los últimos meses
            </p>
          </CardContent>
        </Card>
      </div>

      {stats?.revenueByMonth && stats.revenueByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Ingresos</CardTitle>
            <CardDescription>
              Ingresos y nuevos clientes por mes (últimos 6 meses)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={stats.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'revenue') {
                      return [formatCurrency(value), 'Ingresos'];
                    }
                    return [value, 'Nuevos Clientes'];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Ingresos"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="clientes"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Nuevos Clientes"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}


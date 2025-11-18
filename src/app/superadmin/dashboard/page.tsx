'use client';

import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCardSkeleton, ChartSkeleton } from '@/components/ui/loading';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  CreditCard, 
  Shield, 
  BarChart3, 
  Package,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { tenantsApi } from '@/lib/api/tenants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // Fetch dashboard statistics with real-time updates
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => tenantsApi.getDashboardStats(),
    retry: 1,
    refetchInterval: 30000, // Refrescar cada 30 segundos
    refetchOnWindowFocus: true,
  });

  // Default values while loading
  const dashboardStats = stats || {
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    suspendedTenants: 0,
    revenueChange: 0,
    tenantsChange: 0,
    usersChange: 0,
    revenueByMonth: [
      { month: 'Ene', revenue: 0, clientes: 0 },
      { month: 'Feb', revenue: 0, clientes: 0 },
      { month: 'Mar', revenue: 0, clientes: 0 },
      { month: 'Abr', revenue: 0, clientes: 0 },
      { month: 'May', revenue: 0, clientes: 0 },
      { month: 'Jun', revenue: 0, clientes: 0 },
    ],
    recentTenants: [],
  };

  const metrics = [
    {
      label: 'Total Clientes',
      value: dashboardStats.totalTenants,
      change: dashboardStats.tenantsChange,
      icon: Building2,
      color: 'text-nidia-green',
      bgColor: 'bg-nidia-green/10',
      href: '/superadmin/tenants',
    },
    {
      label: 'Usuarios Totales',
      value: dashboardStats.totalUsers,
      change: dashboardStats.usersChange,
      icon: Users,
      color: 'text-nidia-purple',
      bgColor: 'bg-nidia-purple/10',
      href: '/superadmin/users',
    },
    {
      label: 'Ingresos Mensuales',
      value: `$${dashboardStats.totalRevenue.toLocaleString()}`,
      change: dashboardStats.revenueChange,
      icon: TrendingUp,
      color: 'text-nidia-green',
      bgColor: 'bg-nidia-green/10',
      href: '/superadmin/stats/revenue',
    },
    {
      label: 'Suscripciones Activas',
      value: dashboardStats.activeSubscriptions,
      change: 0,
      icon: CreditCard,
      color: 'text-nidia-purple',
      bgColor: 'bg-nidia-purple/10',
      href: '/superadmin/subscriptions',
    },
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Panel de Administración"
        description={`Bienvenido, ${user?.firstName} ${user?.lastName}`}
        actions={
          <>
            <Button asChild variant="outline" size="default">
              <Link href="/superadmin/stats/overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Estadísticas
              </Link>
            </Button>
            <Button asChild size="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/superadmin/tenants/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Link>
            </Button>
          </>
        }
      />

      {/* Métricas Compactas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))
        ) : (
          metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.change >= 0;
          
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={metric.href}>
                <Card className="hover:shadow-md transition-all duration-200 border-border/50 hover:border-border cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-lg ${metric.bgColor} group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-5 w-5 ${metric.color}`} />
                      </div>
                      {metric.change !== 0 && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isPositive ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          <span>{Math.abs(metric.change)}%</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold tracking-tight">{metric.value}</p>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })
        )}
      </div>

      {/* Gráfico de Tendencias */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Tendencias de Ingresos</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>Últimos 6 meses</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ChartSkeleton height={300} />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardStats.revenueByMonth || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--nidia-green))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--nidia-green))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.5}
              />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ingresos']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--nidia-green))" 
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Grid de Información */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clientes Recientes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Clientes Recientes</CardTitle>
            <Button asChild variant="ghost" size="default">
              <Link href="/superadmin/tenants">
                Ver todos
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !dashboardStats.recentTenants || dashboardStats.recentTenants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm font-medium text-foreground mb-1">No hay clientes registrados</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Comienza creando tu primer cliente
                </p>
                <Button asChild size="default" variant="outline">
                  <Link href="/superadmin/tenants/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Cliente
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardStats.recentTenants.map((tenant: any) => (
                  <Link
                    key={tenant.id}
                    href={`/superadmin/tenants/${tenant.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {tenant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tenant.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        tenant.planStatus === 'active'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : tenant.planStatus === 'trial'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                      }`}>
                        {tenant.planStatus}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones Rápidas y Alertas */}
        <div className="space-y-6">
          {/* Acciones Rápidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start" size="default">
                    <Link href="/superadmin/tenants/new">
                      <Building2 className="h-4 w-4 mr-2" />
                      Crear Cliente
                    </Link>
                  </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="default">
                <Link href="/superadmin/plans/new">
                  <Package className="h-4 w-4 mr-2" />
                  Crear Plan
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start" size="default">
                <Link href="/superadmin/stats/overview">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Estadísticas
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Alertas */}
          {dashboardStats.suspendedTenants > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-base font-semibold text-destructive">
                    Atención Requerida
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Clientes Suspendidos</span>
                    <span className="text-sm font-semibold text-destructive">
                      {dashboardStats.suspendedTenants}
                    </span>
                  </div>
                  <Button asChild variant="outline" size="default" className="w-full mt-3 border-destructive/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
                    <Link href="/superadmin/tenants">
                      Revisar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}

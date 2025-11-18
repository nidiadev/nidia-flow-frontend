'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { dashboardApi, UsersComparison } from '@/lib/api/dashboard';
import { formatCurrency } from '@/lib/utils';
import { StatsCardSkeleton } from '@/components/ui/loading';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface UsersComparisonProps {
  days?: number;
}

export function UsersComparisonComponent({ days = 30 }: UsersComparisonProps) {
  const { data: comparison, isLoading } = useQuery({
    queryKey: ['users-comparison', days],
    queryFn: () => dashboardApi.getUsersComparison(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparativa de Usuarios</CardTitle>
          <CardDescription>Comparación de performance entre vendedores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comparison || comparison.users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparativa de Usuarios</CardTitle>
          <CardDescription>Comparación de performance entre vendedores</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay datos disponibles para comparar
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const chartData = comparison.users.map((user) => ({
    name: user.userName.split(' ')[0], // First name only for chart
    customers: user.customers,
    orders: user.orders,
    revenue: user.revenue,
    conversionRate: user.conversionRate,
  }));

  // Sort by revenue (descending)
  const sortedUsers = [...comparison.users].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-nidia-purple" />
              <span className="text-2xl font-bold">{comparison.totals.customers}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {comparison.users.length} usuario{comparison.users.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-nidia-blue" />
              <span className="text-2xl font-bold">{comparison.totals.orders}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio: {Math.round(comparison.totals.orders / comparison.users.length)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-nidia-green" />
              <span className="text-2xl font-bold">{formatCurrency(comparison.totals.revenue)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio: {formatCurrency(comparison.totals.revenue / comparison.users.length)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue por Usuario</CardTitle>
            <CardDescription>Comparación de ingresos generados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8A2BE2" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes por Usuario</CardTitle>
            <CardDescription>Comparación de órdenes procesadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip labelStyle={{ color: '#000' }} />
                <Legend />
                <Bar dataKey="orders" fill="#2E35F2" name="Órdenes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Usuarios</CardTitle>
          <CardDescription>
            Performance de cada usuario en los últimos {days} días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedUsers.map((user, index) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-nidia-purple/10 text-nidia-purple font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{user.userName}</p>
                    <p className="text-sm text-muted-foreground">{user.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Clientes</p>
                    <p className="font-semibold">{user.customers}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Órdenes</p>
                    <p className="font-semibold">{user.orders}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="font-semibold">{formatCurrency(user.revenue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Conversión</p>
                    <Badge variant="outline" className="font-semibold">
                      {user.conversionRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


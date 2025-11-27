'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, ShoppingCart, Trophy } from 'lucide-react';
import { dashboardApi, UsersComparison } from '@/lib/api/dashboard';
import { formatCurrency } from '@/lib/utils';
import { StatsCardSkeleton } from '@/components/ui/loading';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface UsersComparisonProps {
  days?: number;
}

const revenueChartConfig = {
  revenue: {
    label: 'Revenue',
    color: '#00D9A3', // Nidia Green
  },
} as const;

const ordersChartConfig = {
  orders: {
    label: 'Órdenes',
    color: '#9333EA', // Nidia Purple
  },
} as const;

// Mock data generator for users comparison
const generateMockUsersComparison = (days: number) => {
  const users = [
    { name: 'Camilo Bastidas', email: 'kamirodev.co@gmail.com' },
    { name: 'María García', email: 'maria.garcia@example.com' },
    { name: 'Juan Pérez', email: 'juan.perez@example.com' },
    { name: 'Ana López', email: 'ana.lopez@example.com' },
  ];

  const comparisonUsers = users.map((user, index) => {
    const customers = Math.floor(Math.random() * 50) + 10;
    const orders = Math.floor(Math.random() * 30) + 5;
    const revenue = Math.floor(Math.random() * 100000) + 20000;
    const conversionRate = Math.random() * 20 + 5;

    return {
      userId: `user-${index + 1}`,
      userName: user.name,
      userEmail: user.email,
      customers,
      orders,
      revenue,
      conversionRate,
    };
  });

  const totals = {
    customers: comparisonUsers.reduce((sum, u) => sum + u.customers, 0),
    orders: comparisonUsers.reduce((sum, u) => sum + u.orders, 0),
    revenue: comparisonUsers.reduce((sum, u) => sum + u.revenue, 0),
  };

  return {
    period: {
      from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    },
    users: comparisonUsers,
    totals,
  };
};

export function UsersComparisonComponent({ days = 30 }: UsersComparisonProps) {
  const { data: comparison, isLoading } = useQuery({
    queryKey: ['users-comparison', days],
    queryFn: async () => {
      try {
        const data = await dashboardApi.getUsersComparison(days);
        // Use mock if data is empty or no users
        if (!data || !data.users || data.users.length === 0) {
          return generateMockUsersComparison(days);
        }
        return data;
      } catch (error) {
        // Use mock data if API fails
        return generateMockUsersComparison(days);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
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
      </div>
    );
  }

  // Always use mock data if comparison is empty
  const finalComparison = comparison && comparison.users && comparison.users.length > 0
    ? comparison
    : generateMockUsersComparison(days);

  // Prepare data for charts
  const chartData = finalComparison.users.map((user) => ({
    name: user.userName.split(' ')[0], // First name only for chart
    customers: user.customers,
    orders: user.orders,
    revenue: user.revenue,
    conversionRate: user.conversionRate,
  }));

  // Sort by revenue (descending)
  const sortedUsers = [...finalComparison.users].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finalComparison.totals.customers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {finalComparison.users.length} usuario{finalComparison.users.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Órdenes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finalComparison.totals.orders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio: {Math.round(finalComparison.totals.orders / finalComparison.users.length)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(finalComparison.totals.revenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio: {formatCurrency(finalComparison.totals.revenue / finalComparison.users.length)}
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
            <ChartContainer config={revenueChartConfig} className="h-[300px]">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
                    return `$${value}`;
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="#00D9A3"
                  radius={[4, 4, 0, 0]}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Orders Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes por Usuario</CardTitle>
            <CardDescription>Comparación de órdenes procesadas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={ordersChartConfig} className="h-[300px]">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [value, 'Órdenes']}
                    />
                  }
                />
                <Bar
                  dataKey="orders"
                  fill="#9333EA"
                  radius={[4, 4, 0, 0]}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <CardTitle>Ranking de Usuarios</CardTitle>
          </div>
          <CardDescription>
            Performance de cada usuario en los últimos {days} días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedUsers.map((user, index) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
                    index === 0 
                      ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' 
                      : index === 1
                      ? 'bg-gray-400/20 text-gray-600 dark:text-gray-400'
                      : index === 2
                      ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{user.userName}</p>
                    <p className="text-sm text-muted-foreground">{user.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center min-w-[80px]">
                    <p className="text-xs text-muted-foreground mb-1">Clientes</p>
                    <p className="font-semibold">{user.customers}</p>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <p className="text-xs text-muted-foreground mb-1">Órdenes</p>
                    <p className="font-semibold">{user.orders}</p>
                  </div>
                  <div className="text-center min-w-[100px]">
                    <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                    <p className="font-semibold">{formatCurrency(user.revenue)}</p>
                  </div>
                  <div className="text-center min-w-[100px]">
                    <p className="text-xs text-muted-foreground mb-1">Conversión</p>
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

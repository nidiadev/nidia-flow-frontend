'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  CheckCircle,
  DollarSign,
  Calendar,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useMetricsUpdates, useWebSocket } from '@/hooks/useWebSocket';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  activeCustomers: number;
  customersChange: number;
  completedTasks: number;
  tasksChange: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface OrdersByStatus {
  status: string;
  count: number;
  color: string;
  [key: string]: any;
}

interface TopProducts {
  name: string;
  sales: number;
  revenue: number;
}

// Helper to get CSS variable values (for Recharts compatibility)
const getCSSVariable = (varName: string): string => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

// Using NIDIA brand colors from CSS variables
// Note: Recharts requires actual color values, not CSS variables, so we get them at runtime
const getNIDIAColors = (): string[] => {
  return [
    getCSSVariable('--chart-1') || '#8A2BE2',
    getCSSVariable('--chart-2') || '#1EF3B3',
    getCSSVariable('--chart-3') || '#2E35F2',
    getCSSVariable('--chart-4') || '#00F5D4',
    getCSSVariable('--chart-5') || '#1C1E22'
  ];
};

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState('30');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const queryClient = useQueryClient();
  const chartColors = getNIDIAColors();
  const { isConnected } = useWebSocket();

  // Listen for real-time metrics updates
  useMetricsUpdates((metrics) => {
    queryClient.setQueryData(['dashboard-metrics', dateRange], {
      data: metrics,
    });
  });

  // Fetch dashboard metrics
  const { data: metricsData, refetch: refetchMetrics } = useQuery({
    queryKey: ['dashboard-metrics', dateRange],
    queryFn: async () => {
      const response = await api.get(`/dashboard/metrics?days=${dateRange}`);
      return response.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch revenue chart data
  const { data: revenueData } = useQuery({
    queryKey: ['dashboard-revenue', dateRange],
    queryFn: async () => {
      const response = await api.get(`/dashboard/revenue?days=${dateRange}`);
      return response.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch orders by status
  const { data: ordersByStatusData } = useQuery({
    queryKey: ['dashboard-orders-status', dateRange],
    queryFn: async () => {
      const response = await api.get(
        `/dashboard/orders-by-status?days=${dateRange}`
      );
      return response.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch top products
  const { data: topProductsData } = useQuery({
    queryKey: ['dashboard-top-products', dateRange],
    queryFn: async () => {
      const response = await api.get(
        `/dashboard/top-products?days=${dateRange}&limit=5`
      );
      return response.data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const metrics: DashboardMetrics = metricsData?.data || {
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    activeCustomers: 0,
    customersChange: 0,
    completedTasks: 0,
    tasksChange: 0,
  };

  const revenueChartData: RevenueData[] = revenueData?.data || [];
  const ordersByStatus: OrdersByStatus[] = ordersByStatusData?.data || [];
  const topProducts: TopProducts[] = topProductsData?.data || [];

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    format = 'number',
  }: {
    title: string;
    value: number;
    change: number;
    icon: any;
    format?: 'number' | 'currency';
  }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">
            {format === 'currency' ? formatCurrency(value) : value.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1 text-sm">
            {change >= 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">
                  +{change.toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-600">
                  {change.toFixed(1)}%
                </span>
              </>
            )}
            <span className="text-muted-foreground">vs período anterior</span>
          </div>
        </div>
        <div className="rounded-full bg-nidia-green/20 p-3">
          <Icon className="h-6 w-6 text-nidia-green" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de métricas y rendimiento del negocio
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-green-600">En línea</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-red-600">Desconectado</span>
              </>
            )}
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="365">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              refetchMetrics();
              setAutoRefresh(!autoRefresh);
            }}
            className={autoRefresh ? 'bg-nidia-green/20' : ''}
          >
            <RefreshCw
              className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ingresos Totales"
          value={metrics.totalRevenue}
          change={metrics.revenueChange}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Órdenes"
          value={metrics.totalOrders}
          change={metrics.ordersChange}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Clientes Activos"
          value={metrics.activeCustomers}
          change={metrics.customersChange}
          icon={Users}
        />
        <MetricCard
          title="Tareas Completadas"
          value={metrics.completedTasks}
          change={metrics.tasksChange}
          icon={CheckCircle}
        />
      </div>

      {/* Revenue Chart */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Ingresos y Órdenes</h2>
          <p className="text-sm text-muted-foreground">
            Evolución de ingresos y número de órdenes
          </p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                })
              }
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: any, name: string) => {
                if (name === 'revenue') {
                  return [formatCurrency(value), 'Ingresos'];
                }
                return [value, 'Órdenes'];
              }}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString('es-CO')
              }
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke={chartColors[2]}
              strokeWidth={2}
              name="Ingresos"
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              stroke={chartColors[1]}
              strokeWidth={2}
              name="Órdenes"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by Status */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Órdenes por Estado</h2>
            <p className="text-sm text-muted-foreground">
              Distribución de órdenes según su estado
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ordersByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill={chartColors[0]}
                dataKey="count"
              >
                {ordersByStatus.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Products */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Productos Más Vendidos</h2>
            <p className="text-sm text-muted-foreground">
              Top 5 productos por ingresos
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                cursor={{ fill: 'rgba(46, 53, 242, 0.1)' }}
              />
              <Bar dataKey="revenue" fill={chartColors[2]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Actividad Reciente</h2>
          <p className="text-sm text-muted-foreground">
            Últimas acciones en el sistema
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border p-4"
            >
              <div className="rounded-full bg-nidia-green/20 p-2">
                <CheckCircle className="h-4 w-4 text-nidia-green" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Nueva orden creada #ORD-{1000 + i}
                </p>
                <p className="text-xs text-muted-foreground">
                  Hace {i * 5} minutos
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

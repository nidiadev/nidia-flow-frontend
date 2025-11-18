'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { formatCurrency } from '@/lib/utils';
import { AuthService } from '@/lib/auth';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/use-permissions';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCardSkeleton, ChartSkeleton } from '@/components/ui/loading';
import { dashboardApi, DashboardMetrics as DashboardMetricsType } from '@/lib/api/dashboard';
import { usersApi, TenantUser } from '@/lib/api/users';
import { UsersComparisonComponent } from '@/components/dashboard/users-comparison';

// Using types from dashboardApi
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

export default function TenantDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { user, isAuthenticated } = useAuth();
  const { canViewAll } = usePermissions();
  const [dateRange, setDateRange] = useState('30');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const queryClient = useQueryClient();
  const chartColors = getNIDIAColors();
  const { isConnected } = useWebSocket();

  // Fetch users list for selector (only if can view all)
  const { data: usersData } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => usersApi.list({ isActive: true, limit: 100 }),
    enabled: canViewAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const users = usersData?.users || [];

  // Validar que el slug en la URL coincida con el slug del JWT
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const jwtSlug = AuthService.getTenantSlug();
    
    if (!jwtSlug) {
      // Si no hay slug en el JWT, redirigir al dashboard sin slug (fallback)
      console.warn('⚠️ No se encontró tenantSlug en el JWT, redirigiendo a /dashboard');
      router.replace('/dashboard');
      return;
    }
    
    if (slug !== jwtSlug) {
      // El slug en la URL no coincide con el del JWT, redirigir al correcto
      console.warn(`⚠️ Slug en URL (${slug}) no coincide con JWT (${jwtSlug}), redirigiendo...`);
      router.replace(`/${jwtSlug}/dashboard`);
      return;
    }
  }, [slug, isAuthenticated, router]);

  // Listen for real-time metrics updates
  useMetricsUpdates((metrics) => {
    queryClient.setQueryData(['dashboard-metrics', dateRange], {
      data: metrics,
    });
  });

  // Fetch dashboard metrics
  const { data: metricsData, refetch: refetchMetrics } = useQuery({
    queryKey: ['dashboard-metrics', dateRange, selectedUserId],
    queryFn: async () => {
      if (selectedUserId && canViewAll()) {
        // Fetch metrics for specific user
        return await dashboardApi.getUserMetrics(selectedUserId, parseInt(dateRange));
      }
      // Fetch general metrics (automatically scoped by backend)
      return await dashboardApi.getMetrics(parseInt(dateRange));
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch revenue chart data
  const { data: revenueData } = useQuery({
    queryKey: ['dashboard-revenue', dateRange, selectedUserId],
    queryFn: async () => {
      return await dashboardApi.getRevenue(parseInt(dateRange));
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch orders by status
  const { data: ordersByStatusData } = useQuery({
    queryKey: ['dashboard-orders-status', dateRange, selectedUserId],
    queryFn: async () => {
      return await dashboardApi.getOrdersByStatus(parseInt(dateRange));
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch top products
  const { data: topProductsData } = useQuery({
    queryKey: ['dashboard-top-products', dateRange, selectedUserId],
    queryFn: async () => {
      return await dashboardApi.getTopProducts(parseInt(dateRange), 5);
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Transform metrics to match the expected format
  const metrics: DashboardMetrics = metricsData
    ? {
        totalRevenue: metricsData.sales?.totalRevenue || 0,
        revenueChange: 0, // TODO: Calculate from previous period
        totalOrders: metricsData.orders?.total || 0,
        ordersChange: 0, // TODO: Calculate from previous period
        activeCustomers: metricsData.customers?.active || 0,
        customersChange: 0, // TODO: Calculate from previous period
        completedTasks: 0, // TODO: Add tasks to dashboard metrics
        tasksChange: 0,
      }
    : {
        totalRevenue: 0,
        revenueChange: 0,
        totalOrders: 0,
        ordersChange: 0,
        activeCustomers: 0,
        customersChange: 0,
        completedTasks: 0,
        tasksChange: 0,
      };

  // Transform revenue data for chart
  const revenueChartData = revenueData
    ? revenueData.map((item) => ({
        date: item.period,
        revenue: item.totalRevenue,
        orders: item.orderCount,
      }))
    : [];

  // Transform orders by status for chart
  const ordersByStatus = ordersByStatusData
    ? ordersByStatusData.map((item) => ({
        status: item.status,
        count: item.count,
        color: '#8A2BE2', // Default color
        totalValue: item.totalValue,
      }))
    : [];

  // Transform top products for chart
  const topProducts = topProductsData
    ? topProductsData.map((item) => ({
        name: item.productName,
        sales: item.totalQuantity,
        revenue: item.totalRevenue,
      }))
    : [];

  // Get selected user info
  const selectedUser = selectedUserId
    ? users.find((u) => u.id === selectedUserId)
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title={selectedUser ? `Dashboard - ${selectedUser.firstName} ${selectedUser.lastName}` : 'Dashboard'}
        description={
          selectedUser
            ? `Métricas y estadísticas de ${selectedUser.firstName} ${selectedUser.lastName}`
            : 'Resumen de tu negocio'
        }
        actions={
        <div className="flex items-center gap-3">
          {canViewAll() && users.length > 0 && (
            <Select
              value={selectedUserId || 'all'}
              onValueChange={(value) => setSelectedUserId(value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rango de fechas" />
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
            onClick={() => refetchMetrics()}
            title="Actualizar datos"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">En línea</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Desconectado</span>
              </>
            )}
          </div>
        </div>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Ingresos Totales
              </p>
              <p className="text-2xl font-bold mt-2">
                {formatCurrency(metrics.totalRevenue)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {metrics.revenueChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    metrics.revenueChange >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {Math.abs(metrics.revenueChange)}%
                </span>
                <span className="text-sm text-muted-foreground">
                  vs período anterior
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Órdenes Totales
              </p>
              <p className="text-2xl font-bold mt-2">{metrics.totalOrders}</p>
              <div className="flex items-center gap-1 mt-2">
                {metrics.ordersChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    metrics.ordersChange >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {Math.abs(metrics.ordersChange)}%
                </span>
                <span className="text-sm text-muted-foreground">
                  vs período anterior
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Clientes Activos
              </p>
              <p className="text-2xl font-bold mt-2">
                {metrics.activeCustomers}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {metrics.customersChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    metrics.customersChange >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {Math.abs(metrics.customersChange)}%
                </span>
                <span className="text-sm text-muted-foreground">
                  vs período anterior
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Tareas Completadas
              </p>
              <p className="text-2xl font-bold mt-2">
                {metrics.completedTasks}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {metrics.tasksChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    metrics.tasksChange >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {Math.abs(metrics.tasksChange)}%
                </span>
                <span className="text-sm text-muted-foreground">
                  vs período anterior
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Ingresos y Órdenes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={chartColors[0]}
                name="Ingresos"
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke={chartColors[1]}
                name="Órdenes"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Órdenes por Estado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill={chartColors[2]} name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={topProducts as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => {
                const { name, percent } = props;
                return `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="sales"
            >
              {topProducts.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Users Comparison - Only for admins when viewing all users */}
      {canViewAll() && !selectedUserId && (
        <UsersComparisonComponent days={parseInt(dateRange)} />
      )}
    </div>
  );
}


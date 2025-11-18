'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Download, Eye } from 'lucide-react';
import { useOrderEvents } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { TenantLink } from '@/components/ui/tenant-link';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';
import { DataTable, DataTableAction } from '@/components/ui/data-table';

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
  };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  assignedTo?: {
    id: string;
    name: string;
  };
}

const statusColors = {
  pending: 'bg-muted text-muted-foreground',
  confirmed: 'bg-nidia-blue/20 text-nidia-blue',
  in_progress: 'bg-nidia-purple/20 text-nidia-purple',
  completed: 'bg-nidia-green/20 text-nidia-green',
  cancelled: 'bg-destructive/20 text-destructive',
};

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  in_progress: 'En Progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

// Define columns for DataTable
function getColumns(): ColumnDef<Order>[] {
  return [
    {
      accessorKey: 'orderNumber',
      header: 'Número',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Cliente',
      cell: ({ row }) => row.original.customer.name,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.status]}>
          {statusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'assignedTo',
      header: 'Asignado a',
      cell: ({ row }) => row.original.assignedTo?.name || 'Sin asignar',
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(row.original.totalAmount)}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString('es-CO')}
        </div>
      ),
    },
  ];
}

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;
  const queryClient = useQueryClient();

  // Listen for real-time order updates
  useOrderEvents(
    (order) => {
      // Order created
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    (order) => {
      // Order updated
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    (order) => {
      // Order assigned
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  );

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      const response = await api.get(`/orders?${params}`);
      return response.data;
    },
  });

  const orders: Order[] = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const columns = useMemo(() => getColumns(), []);

  // Filter orders by status
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(order => order.status === statusFilter);
  }, [orders, statusFilter]);

  const { hasPermission } = usePermissions();

  // Actions for DataTable
  const actions: DataTableAction<Order>[] = [
    {
      label: 'Ver detalles',
      icon: <Eye className="h-4 w-4" />,
      onClick: (order) => {
        // Navigate to order details
        window.location.href = `/orders/${order.id}`;
      },
      requiredPermission: ['orders:read'],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes"
        description="Gestiona todas las órdenes de venta y servicio"
        variant="gradient"
        actions={
          (hasPermission('orders:write') || hasPermission('orders:create')) ? (
            <Button asChild>
              <TenantLink href="/orders/new">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Orden
              </TenantLink>
            </Button>
          ) : null
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <DataTable
          data={filteredOrders}
          columns={columns}
          searchPlaceholder="Buscar por número de orden, cliente..."
          emptyMessage="No se encontraron órdenes"
          emptyDescription="Intenta con otros términos de búsqueda o filtros"
          isLoading={isLoading}
          actions={actions}
          enableColumnVisibility={true}
          enableColumnSizing={true}
          getRowId={(row) => row.id}
        />
      </Card>
    </div>
  );
}

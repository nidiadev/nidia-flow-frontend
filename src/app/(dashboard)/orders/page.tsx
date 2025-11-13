'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { useOrderEvents } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">Órdenes</h1>
          <p className="text-muted-foreground">
            Gestiona todas las órdenes de venta y servicio
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Orden
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de orden, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Asignado a</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No se encontraron órdenes
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.assignedTo?.name || 'Sin asignar'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString('es-CO')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Ver detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

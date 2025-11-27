'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { inventoryApi, productsApi, InventoryMovement, CreateInventoryMovementDto } from '@/lib/api/products';
import { Table } from '@/components/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InventoryMovementWithProduct extends InventoryMovement {
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  variant?: {
    id: string;
    name: string;
  };
}

// Define columns for DataTable
function getColumns(): ColumnDef<InventoryMovementWithProduct>[] {
  return [
    {
      accessorKey: 'product.name',
      header: 'Producto',
      cell: ({ row }) => {
        const movement = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-nidia-green/80 to-nidia-purple/80 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">
                {movement.product?.name || 'Producto sin nombre'}
              </div>
              {movement.variant && (
                <div className="text-xs text-muted-foreground">
                  Variante: {movement.variant.name}
                </div>
              )}
              {movement.product?.sku && (
                <div className="text-xs text-muted-foreground">
                  SKU: {movement.product.sku}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.original.type;
        const config: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
          in: { label: 'Entrada', variant: 'default' },
          out: { label: 'Salida', variant: 'destructive' },
          adjustment: { label: 'Ajuste', variant: 'secondary' },
          transfer: { label: 'Transferencia', variant: 'secondary' },
          sale: { label: 'Venta', variant: 'destructive' },
          return: { label: 'Devolución', variant: 'default' },
          damaged: { label: 'Dañado', variant: 'destructive' },
          expired: { label: 'Vencido', variant: 'destructive' },
        };
        const { label, variant } = config[type] || { label: type, variant: 'secondary' as const };
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Cantidad',
      cell: ({ row }) => {
        const movement = row.original;
        const isPositive = movement.quantity > 0;
        return (
          <div className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{movement.quantity}
          </div>
        );
      },
    },
    {
      accessorKey: 'reason',
      header: 'Motivo',
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.reason}>
          {row.original.reason}
        </div>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Notas',
      cell: ({ row }) => {
        const notes = row.original.notes;
        return notes ? (
          <div className="max-w-xs truncate" title={notes}>
            {notes}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">
            {format(new Date(row.original.createdAt), 'PP', { locale: es })}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(row.original.createdAt), 'p', { locale: es })}
          </div>
        </div>
      ),
    },
  ];
}

// New Movement Dialog
function NewMovementDialog({ products }: { products: any[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment' | 'transfer' | 'sale' | 'return' | 'damaged' | 'expired'>('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  // Fetch variants for selected product
  const { data: variantsData } = useQuery({
    queryKey: ['variants', productId],
    queryFn: async () => {
      if (!productId) return { data: { data: [] } };
      const response = await productsApi.getById(productId);
      return response;
    },
    enabled: !!productId,
  });

  const variants = variantsData?.data?.variants || [];

  const createMovementMutation = useMutation({
    mutationFn: (data: CreateInventoryMovementDto) => inventoryApi.createMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast.success('Movimiento de inventario registrado correctamente');
      setOpen(false);
      setProductId('');
      setVariantId('');
      setMovementType('in');
      setQuantity('');
      setReason('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al registrar el movimiento');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || !reason) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    createMovementMutation.mutate({
      productId,
      variantId: variantId || undefined,
      type: movementType,
      quantity: parseFloat(quantity),
      reason,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Movimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
          <DialogDescription>
            Registra una entrada, salida o ajuste de inventario
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Producto *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {variants.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="variant">Variante</Label>
                <Select value={variantId} onValueChange={setVariantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin variante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin variante</SelectItem>
                    {variants.map((variant: any) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Movimiento *</Label>
              <Select value={movementType} onValueChange={(value: any) => setMovementType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada</SelectItem>
                  <SelectItem value="out">Salida</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="sale">Venta</SelectItem>
                  <SelectItem value="return">Devolución</SelectItem>
                  <SelectItem value="damaged">Dañado</SelectItem>
                  <SelectItem value="expired">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe el motivo del movimiento..."
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMovementMutation.isPending}>
              {createMovementMutation.isPending ? 'Registrando...' : 'Registrar Movimiento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const { route } = useTenantRoutes();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch products for dialog
  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const response = await productsApi.getAll({ limit: 1000 });
      return response;
    },
  });

  const products = productsData?.data?.data || [];

  // Fetch inventory movements
  const { data: movementsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['inventory-movements', typeFilter, page],
    queryFn: async () => {
      const response = await inventoryApi.getMovements({
        page,
        limit,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      });
      return response;
    },
  });

  const movements = (movementsData?.data?.data || []) as InventoryMovementWithProduct[];
  const pagination = movementsData?.data?.pagination;

  const columns = useMemo(() => getColumns(), []);

  // Calculate stats
  const statsData = useMemo(() => {
    const entries = movements.filter(m => m.type === 'in' || m.type === 'return').length;
    const exits = movements.filter(m => ['out', 'sale', 'damaged', 'expired'].includes(m.type)).length;
    const adjustments = movements.filter(m => m.type === 'adjustment').length;
    
    return [
      {
        label: 'Total Movimientos',
        value: pagination?.total || movements.length,
        description: 'En el período',
        icon: <ArrowUpDown className="h-4 w-4 text-muted-foreground" />,
      },
      {
        label: 'Entradas',
        value: entries,
        description: 'Entradas y devoluciones',
        icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      },
      {
        label: 'Salidas',
        value: exits,
        description: 'Salidas, ventas, dañados',
        icon: <TrendingDown className="h-4 w-4 text-red-500" />,
      },
      {
        label: 'Ajustes',
        value: adjustments,
        description: 'Ajustes de inventario',
        icon: <Package className="h-4 w-4 text-blue-500" />,
      },
    ];
  }, [movements, pagination]);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <SectionHeader
          title="Inventario"
          description="Gestiona los movimientos de inventario y el historial de stock"
        />

        <Table
          id="inventory-movements"
          data={movements}
          columns={columns}
          search={{
            enabled: true,
            placeholder: 'Buscar por producto, SKU, motivo...',
          }}
          filters={[
            {
              key: 'type',
              label: 'Tipo',
              type: 'select',
              options: [
                { value: 'all', label: 'Todos los tipos' },
                { value: 'in', label: 'Entradas' },
                { value: 'out', label: 'Salidas' },
                { value: 'adjustment', label: 'Ajustes' },
                { value: 'sale', label: 'Ventas' },
                { value: 'return', label: 'Devoluciones' },
              ],
            },
          ]}
          onFiltersChange={(filters) => {
            if (filters.type !== undefined) {
              setTypeFilter(filters.type);
            }
          }}
          pagination={{
            enabled: true,
            pageSize: limit,
            serverSide: true,
            total: pagination?.total,
            onPageChange: (newPage) => setPage(newPage),
          }}
          actions={[
            {
              label: 'Nuevo Movimiento',
              icon: <Plus className="h-4 w-4" />,
              render: () => <NewMovementDialog products={products} />,
            },
          ]}
          stats={{
            enabled: true,
            stats: statsData,
          }}
          emptyState={{
            icon: <Package className="h-16 w-16 text-muted-foreground/50" />,
            title: 'No hay movimientos de inventario',
            description: 'Los movimientos de inventario (entradas, salidas, ajustes) aparecerán aquí',
          }}
          isLoading={isLoading}
          isError={isError}
          error={error as Error | null}
          onRetry={refetch}
          features={{
            columnVisibility: true,
          }}
          getRowId={(row) => row.id}
        />
      </div>
    </ErrorBoundary>
  );
}

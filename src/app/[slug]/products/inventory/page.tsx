'use client';

import { useState, useMemo, useEffect } from 'react';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SmartSelect } from '@/components/ui/smart-select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Building2,
  HelpCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { TenantLink } from '@/components/ui/tenant-link';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { inventoryApi, productsApi, warehousesApi, InventoryMovement, CreateInventoryMovementDto } from '@/lib/api/products';
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
      accessorKey: 'warehouseId', // Show warehouse info if available (would require backend to return warehouse name)
      header: 'Bodega',
      cell: ({ row }) => {
         // Assuming the backend might include warehouse info in the future, or we just show a placeholder if not.
         // Since we don't have warehouse name in the response DTO yet, we can't show name.
         // But we can show an icon or something if warehouseId exists.
         return row.original.warehouseId ? (
             <Badge variant="outline" className="gap-1">
                 <Building2 className="h-3 w-3" />
                 Bodega
             </Badge>
         ) : (
             <span className="text-muted-foreground text-xs">-</span>
         );
      }
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

// New Movement Drawer
function NewMovementDrawer({ products, warehouses }: { products: any[]; warehouses: any[] }) {
  const queryClient = useQueryClient();
  const { route } = useTenantRoutes();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('none');
  const [warehouseId, setWarehouseId] = useState('none');
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment' | 'transfer' | 'sale' | 'return' | 'damaged' | 'expired'>('in');
  const [quantityInput, setQuantityInput] = useState('');
  const [reason, setReason] = useState('');

  // Fetch variants for selected product
  const { data: variantsData } = useQuery({
    queryKey: ['variants', productId],
    queryFn: async () => {
      if (!productId) return { data: { data: [] } };
      const response = await productsApi.getById(productId);
      return response;
    },
    enabled: !!productId && open,
  });

  const variants = variantsData?.data?.variants || [];
  
  // Validar que haya bodegas
  const hasWarehouses = warehouses.length > 0;

  const createMovementMutation = useMutation({
    mutationFn: (data: CreateInventoryMovementDto) => inventoryApi.createMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Movimiento de inventario registrado correctamente');
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al registrar el movimiento');
    },
  });

  const resetForm = () => {
    setProductId('');
    setVariantId('none');
    setWarehouseId('none');
    setMovementType('in');
    setQuantityInput('');
    setReason('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasWarehouses) {
      toast.error('Debes crear al menos una bodega antes de registrar movimientos');
      return;
    }
    
    if (!productId) {
      toast.error('Selecciona un producto');
      return;
    }
    
    if (!warehouseId || warehouseId === 'none') {
      toast.error('Selecciona una bodega');
      return;
    }
    
    if (!quantityInput || parseFloat(quantityInput) <= 0) {
      toast.error('Ingresa una cantidad válida mayor a 0');
      return;
    }
    
    if (!reason.trim()) {
      toast.error('Describe el motivo del movimiento');
      return;
    }

    createMovementMutation.mutate({
      productId,
      productVariantId: variantId && variantId !== 'none' ? variantId : undefined,
      warehouseId: warehouseId !== 'none' ? warehouseId : undefined,
      type: movementType,
      quantity: parseFloat(quantityInput),
      reason: reason.trim(),
    });
  };

  const isPending = createMovementMutation.isPending;

  // Reset form when drawer opens/closes
  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <TooltipProvider>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        <DrawerContent direction="right" className="h-full flex flex-col">
          <DrawerHeader className="text-left border-b flex-shrink-0">
            <DrawerTitle>Registrar Movimiento de Inventario</DrawerTitle>
            <DrawerDescription>
              Registra una entrada, salida o ajuste de inventario en una bodega específica
            </DrawerDescription>
          </DrawerHeader>
          
          {!hasWarehouses ? (
            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
              <div className="max-w-2xl mx-auto">
                <div className="border rounded-lg p-6 bg-muted/30 text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-warning mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No hay bodegas creadas</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Debes crear al menos una bodega antes de poder registrar movimientos de inventario.
                    </p>
                    <Button asChild>
                      <TenantLink href={route('/products/warehouses')}>
                        <Building2 className="h-4 w-4 mr-2" />
                        Ir a Bodegas
                      </TenantLink>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
                <div className="space-y-6 max-w-2xl mx-auto">
                  
                  {/* Product Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="product" className="text-sm font-medium">
                        Producto <span className="text-destructive">*</span>
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Selecciona el producto al que corresponde este movimiento de inventario.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <SmartSelect
                      id="product"
                      options={products.map((product: any) => ({
                        value: product.id,
                        label: `${product.name}${product.sku ? ` (${product.sku})` : ''}`,
                      }))}
                      value={productId || undefined}
                      onValueChange={setProductId}
                      placeholder="Seleccionar producto"
                      searchPlaceholder="Buscar producto..."
                      disabled={isPending}
                    />
                  </div>

                  {/* Variant Selection */}
                  {variants.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="variant" className="text-sm font-medium">
                          Variante
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>Opcionalmente selecciona una variante específica del producto. Si no seleccionas ninguna, el movimiento se aplicará al producto base.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <SmartSelect
                        id="variant"
                        options={[
                          { value: 'none', label: 'Sin variante' },
                          ...variants.map((variant: any) => ({
                            value: variant.id,
                            label: variant.name,
                          }))
                        ]}
                        value={variantId}
                        onValueChange={setVariantId}
                        placeholder="Sin variante"
                        searchPlaceholder="Buscar variante..."
                        disabled={isPending || !productId}
                      />
                    </div>
                  )}

                  {/* Warehouse and Movement Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="warehouse" className="text-sm font-medium">
                          Bodega <span className="text-destructive">*</span>
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>Selecciona la bodega donde se realizará el movimiento. El inventario se registrará en la bodega seleccionada.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <SmartSelect
                        id="warehouse"
                        options={warehouses.map((warehouse: any) => ({
                          value: warehouse.id,
                          label: `${warehouse.name}${warehouse.isDefault ? ' (Predeterminada)' : ''}`,
                        }))}
                        value={warehouseId !== 'none' ? warehouseId : undefined}
                        onValueChange={(value) => setWarehouseId(value || 'none')}
                        placeholder="Seleccionar bodega"
                        searchPlaceholder="Buscar bodega..."
                        disabled={isPending}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="type" className="text-sm font-medium">
                          Tipo de Movimiento <span className="text-destructive">*</span>
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>Selecciona el tipo de movimiento: Entrada (aumenta stock), Salida (disminuye stock), Ajuste (corrige inventario), etc.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <SmartSelect
                        id="type"
                        options={[
                          { value: 'in', label: 'Entrada' },
                          { value: 'out', label: 'Salida' },
                          { value: 'adjustment', label: 'Ajuste' },
                          { value: 'transfer', label: 'Transferencia' },
                          { value: 'sale', label: 'Venta' },
                          { value: 'return', label: 'Devolución' },
                          { value: 'damaged', label: 'Dañado' },
                          { value: 'expired', label: 'Vencido' },
                        ]}
                        value={movementType}
                        onValueChange={(value: any) => setMovementType(value)}
                        placeholder="Seleccionar tipo"
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="quantity" className="text-sm font-medium">
                        Cantidad <span className="text-destructive">*</span>
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Ingresa la cantidad de unidades del movimiento. Debe ser mayor a 0. Para salidas, el sistema validará que haya suficiente stock disponible.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      placeholder="0.00"
                      required
                      disabled={isPending}
                      className="h-10"
                    />
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="reason" className="text-sm font-medium">
                        Motivo <span className="text-destructive">*</span>
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Describe el motivo o razón del movimiento. Esta información quedará registrada en el historial para auditoría y trazabilidad.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Describe el motivo del movimiento..."
                      required
                      disabled={isPending}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
              
              <DrawerFooter className="border-t flex-shrink-0 bg-background">
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending || !productId || !warehouseId || warehouseId === 'none' || !quantityInput || !reason.trim()}>
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      'Registrar Movimiento'
                    )}
                  </Button>
                </div>
              </DrawerFooter>
            </form>
          )}
        </DrawerContent>
      </Drawer>
    </TooltipProvider>
  );
}

export default function InventoryPage() {
  const { route } = useTenantRoutes();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch products for dialog (paginated to get all)
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'for-inventory-filter'],
    queryFn: async () => {
      // First request to get total count
      const firstPage = await productsApi.getAll({ page: 1, limit: 100 });
      const total = firstPage?.data?.pagination?.total || 0;
      
      if (total <= 100) {
        return firstPage;
      }
      
      // If more than 100, fetch remaining pages
      const totalPages = Math.ceil(total / 100);
      const allProducts = [...(firstPage?.data?.data || [])];
      
      for (let page = 2; page <= totalPages; page++) {
        const pageData = await productsApi.getAll({ page, limit: 100 });
        allProducts.push(...(pageData?.data?.data || []));
      }
      
      return { data: { data: allProducts, pagination: { total } } };
    },
  });

  const products = productsData?.data?.data || [];

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.getAll(),
  });

  const warehouses = warehousesData?.data || [];

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
              render: () => <NewMovementDrawer products={products} warehouses={warehouses} />,
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

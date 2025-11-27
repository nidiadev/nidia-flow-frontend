'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Edit,
  Eye,
  Grid3x3,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  HelpCircle,
  Info,
  Palette,
  Ruler,
  DollarSign,
  Boxes,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { TenantLink } from '@/components/ui/tenant-link';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { useRouter } from 'next/navigation';
import { productsApi, variantsApi, ProductVariant, Product } from '@/lib/api/products';
import { Table } from '@/components/table';
import { TableRowAction } from '@/components/table/types';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

// Extended variant interface with product info
interface VariantWithProduct extends ProductVariant {
  product?: {
    id: string;
    name: string;
    sku: string;
    type: string;
    price: number;
    stockMin?: number;
  };
}

// Default low stock threshold
const DEFAULT_LOW_STOCK_THRESHOLD = 10;

// Define columns for DataTable
function getColumns(): ColumnDef<VariantWithProduct>[] {
  return [
    {
      accessorKey: 'product.name',
      header: 'Producto',
      cell: ({ row }) => {
        const variant = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-nidia-green/80 to-nidia-purple/80 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">
                {variant.product?.name || 'Producto sin nombre'}
              </div>
              <div className="text-xs text-muted-foreground">
                SKU: {variant.product?.sku || 'N/A'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Variante',
      cell: ({ row }) => {
        const variant = row.original;
        return (
          <div>
            <div className="font-medium">{variant.name}</div>
            {variant.option1Name && variant.option1Value && (
              <div className="text-xs text-muted-foreground">
                {variant.option1Name}: {variant.option1Value}
                {variant.option2Name && variant.option2Value && (
                  <> • {variant.option2Name}: {variant.option2Value}</>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {row.original.sku || 'N/A'}
        </code>
      ),
    },
    {
      accessorKey: 'stockQuantity',
      header: 'Stock',
      cell: ({ row }) => {
        const variant = row.original;
        const stock = variant.stockQuantity || 0;
        // Usar el stockMin del producto padre o un umbral por defecto
        const minStock = variant.product?.stockMin || DEFAULT_LOW_STOCK_THRESHOLD;
        
        let status: 'success' | 'warning' | 'danger' = 'success';
        if (stock === 0) {
          status = 'danger';
        } else if (stock <= minStock) {
          status = 'warning';
        }

        return (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${
              status === 'danger' ? 'text-red-600' :
              status === 'warning' ? 'text-orange-600' :
              'text-green-600'
            }`}>
              {stock}
            </span>
            {status !== 'success' && (
              <AlertTriangle className={`h-4 w-4 ${
                status === 'danger' ? 'text-red-500' : 'text-orange-500'
              }`} />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'priceAdjustment',
      header: 'Precio Final',
      cell: ({ row }) => {
        const variant = row.original;
        const basePrice = variant.product?.price || 0;
        const adjustment = variant.priceAdjustment || 0;
        const finalPrice = basePrice + adjustment;
        
        return (
          <div>
            <div className="font-semibold">
              {formatCurrency(finalPrice)}
            </div>
            {adjustment !== 0 && (
              <div className={`text-xs ${adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {adjustment > 0 ? '+' : ''}{formatCurrency(adjustment)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];
}

// Edit Variant Dialog
function EditVariantDialog({
  variant,
  open,
  onOpenChange,
  onSuccess,
}: {
  variant: VariantWithProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    priceAdjustment: 0,
    stockQuantity: 0,
    isActive: true,
  });

  // Update form when variant changes
  useMemo(() => {
    if (variant) {
      setFormData({
        name: variant.name || '',
        sku: variant.sku || '',
        priceAdjustment: variant.priceAdjustment || 0,
        stockQuantity: variant.stockQuantity || 0,
        isActive: variant.isActive ?? true,
      });
    }
  }, [variant]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!variant) throw new Error('No variant selected');
      return variantsApi.update(variant.productId, variant.id, {
        name: data.name,
        sku: data.sku,
        priceAdjustment: data.priceAdjustment,
        stockQuantity: data.stockQuantity,
        isActive: data.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      toast.success('Variante actualizada correctamente');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar la variante');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    await updateMutation.mutateAsync(formData);
  };

  if (!variant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Variante</DialogTitle>
            <DialogDescription>
              Producto: {variant.product?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Rojo - Grande"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="SKU de variante"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceAdjustment">Ajuste de Precio</Label>
                <Input
                  id="priceAdjustment"
                  type="number"
                  step="0.01"
                  value={formData.priceAdjustment}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceAdjustment: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Precio base: {formatCurrency(variant.product?.price || 0)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Variante activa</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Variant Dialog
function CreateVariantDialog({
  open,
  onOpenChange,
  products,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    priceAdjustment: 0,
    stockQuantity: 0,
    option1Name: '',
    option1Value: '',
    option2Name: '',
    option2Value: '',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error('Selecciona un producto');
      return variantsApi.create(productId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      toast.success('Variante creada correctamente');
      onOpenChange(false);
      setProductId('');
      setFormData({
        name: '',
        sku: '',
        priceAdjustment: 0,
        stockQuantity: 0,
        option1Name: '',
        option1Value: '',
        option2Name: '',
        option2Value: '',
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear la variante');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error('Selecciona un producto');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    await createMutation.mutateAsync();
  };

  const selectedProduct = products.find(p => p.id === productId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva Variante</DialogTitle>
            <DialogDescription>
              Crea una nueva variante para un producto existente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Producto *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nombre *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Rojo - Grande"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-sku">SKU</Label>
                <Input
                  id="create-sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Auto-generado si vacío"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-option1Name">Opción 1 (Nombre)</Label>
                <Input
                  id="create-option1Name"
                  value={formData.option1Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, option1Name: e.target.value }))}
                  placeholder="Ej: Color"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-option1Value">Opción 1 (Valor)</Label>
                <Input
                  id="create-option1Value"
                  value={formData.option1Value}
                  onChange={(e) => setFormData(prev => ({ ...prev, option1Value: e.target.value }))}
                  placeholder="Ej: Rojo"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-option2Name">Opción 2 (Nombre)</Label>
                <Input
                  id="create-option2Name"
                  value={formData.option2Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, option2Name: e.target.value }))}
                  placeholder="Ej: Talla"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-option2Value">Opción 2 (Valor)</Label>
                <Input
                  id="create-option2Value"
                  value={formData.option2Value}
                  onChange={(e) => setFormData(prev => ({ ...prev, option2Value: e.target.value }))}
                  placeholder="Ej: Grande"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-priceAdjustment">Ajuste de Precio</Label>
                <Input
                  id="create-priceAdjustment"
                  type="number"
                  step="0.01"
                  value={formData.priceAdjustment}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceAdjustment: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
                {selectedProduct && (
                  <p className="text-xs text-muted-foreground">
                    Precio base: {formatCurrency(selectedProduct.price)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-stockQuantity">Stock Inicial</Label>
                <Input
                  id="create-stockQuantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creando...' : 'Crear Variante'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function VariantsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { route } = useTenantRoutes();
  const [productFilter, setProductFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<VariantWithProduct | null>(null);
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);

  // Fetch all products to populate filter (paginated to get all)
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'for-variants-filter'],
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

  // Fetch variants for all products
  const { data: variantsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['variants', 'all', productFilter],
    queryFn: async () => {
      const productsWithVariants = productFilter !== 'all' 
        ? [products.find((p: any) => p.id === productFilter)].filter(Boolean)
        : products;

      const variantsPromises = productsWithVariants.map(async (product: any) => {
        try {
          const response = await variantsApi.getByProduct(product.id);
          const variants = response.data?.data || [];
          return variants.map((variant: ProductVariant) => ({
            ...variant,
            product: {
              id: product.id,
              name: product.name,
              sku: product.sku,
              type: product.type,
              price: product.price,
              stockMin: product.stockMin,
            },
          }));
        } catch (error) {
          console.error(`Error fetching variants for product ${product.id}:`, error);
          return [];
        }
      });

      const allVariants = (await Promise.all(variantsPromises)).flat();
      return { data: allVariants };
    },
    enabled: products.length > 0,
  });

  const allVariants = (variantsData?.data || []) as VariantWithProduct[];

  // Filter variants by stock
  const filteredVariants = useMemo(() => {
    let filtered = [...allVariants];

    if (stockFilter === 'in_stock') {
      filtered = filtered.filter((v) => (v.stockQuantity || 0) > 0);
    } else if (stockFilter === 'low_stock') {
      filtered = filtered.filter((v) => {
        const stock = v.stockQuantity || 0;
        const minStock = v.product?.stockMin || DEFAULT_LOW_STOCK_THRESHOLD;
        return stock > 0 && stock <= minStock;
      });
    } else if (stockFilter === 'out_of_stock') {
      filtered = filtered.filter((v) => (v.stockQuantity || 0) === 0);
    }

    return filtered;
  }, [allVariants, stockFilter]);

  const columns = useMemo(() => getColumns(), []);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (variant: VariantWithProduct) => {
      return variantsApi.delete(variant.productId, variant.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      toast.success('Variante eliminada correctamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar la variante');
    },
  });

  // Row actions
  const rowActions: TableRowAction<VariantWithProduct>[] = useMemo(() => [
    {
      label: 'Ver Producto',
      icon: <Eye className="h-4 w-4" />,
      onClick: (variant) => {
        router.push(route(`/products/catalog/${variant.productId}`));
      },
    },
    {
      label: 'Editar Variante',
      icon: <Edit className="h-4 w-4" />,
      onClick: (variant) => {
        setSelectedVariant(variant);
        setEditDialogOpen(true);
      },
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      separator: true,
      onClick: (variant) => {
        if (confirm(`¿Estás seguro de eliminar la variante "${variant.name}"?`)) {
          deleteMutation.mutate(variant);
        }
      },
    },
  ], [route, router, deleteMutation]);

  // Stats
  const statsData = useMemo(() => {
    const total = allVariants.length;
    const inStock = allVariants.filter(v => (v.stockQuantity || 0) > 0).length;
    const lowStock = allVariants.filter(v => {
      const stock = v.stockQuantity || 0;
      const minStock = v.product?.stockMin || DEFAULT_LOW_STOCK_THRESHOLD;
      return stock > 0 && stock <= minStock;
    }).length;
    const outOfStock = allVariants.filter(v => (v.stockQuantity || 0) === 0).length;

    return [
      {
        label: 'Total Variantes',
        value: total,
        description: 'En todos los productos',
        icon: <Grid3x3 className="h-4 w-4 text-muted-foreground" />,
      },
      {
        label: 'En Stock',
        value: inStock,
        description: 'Con disponibilidad',
        icon: <Package className="h-4 w-4 text-green-500" />,
      },
      {
        label: 'Stock Bajo',
        value: lowStock,
        description: 'Requieren atención',
        icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
      },
      {
        label: 'Sin Stock',
        value: outOfStock,
        description: 'Agotados',
        icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      },
    ];
  }, [allVariants]);

  // Product options for filter
  const productOptions = useMemo(() => [
    { value: 'all', label: 'Todos los productos' },
    ...products.map((p: any) => ({ value: p.id, label: p.name })),
  ], [products]);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <SectionHeader
          title="Variantes de Productos"
          description="Gestiona todas las variantes de tus productos (tallas, colores, etc.)"
          actions={
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          }
        />

        <Table
          id="product-variants"
          data={filteredVariants}
          columns={columns}
          search={{
            enabled: true,
            placeholder: 'Buscar por nombre, SKU, producto...',
          }}
          filters={[
            {
              key: 'product',
              label: 'Producto',
              type: 'select',
              options: productOptions,
            },
            {
              key: 'stock',
              label: 'Stock',
              type: 'select',
              options: [
                { value: 'all', label: 'Todos' },
                { value: 'in_stock', label: 'En stock' },
                { value: 'low_stock', label: 'Stock bajo' },
                { value: 'out_of_stock', label: 'Sin stock' },
              ],
            },
          ]}
          onFiltersChange={(filters) => {
            if (filters.product !== undefined) {
              setProductFilter(filters.product);
            }
            if (filters.stock !== undefined) {
              setStockFilter(filters.stock);
            }
          }}
          rowActions={rowActions}
          actions={[
            {
              label: 'Nueva Variante',
              icon: <Plus className="h-4 w-4" />,
              onClick: () => setCreateDialogOpen(true),
            },
            {
              label: 'Ver Productos',
              icon: <Package className="h-4 w-4" />,
              variant: 'outline',
              onClick: () => router.push(route('/products/catalog')),
            },
          ]}
          stats={{
            enabled: true,
            stats: statsData,
          }}
          emptyState={{
            icon: <Grid3x3 className="h-16 w-16 text-muted-foreground/50" />,
            title: 'No hay variantes',
            description: 'Las variantes de productos aparecerán aquí cuando crees productos con opciones (tallas, colores, etc.)',
            action: (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Variante
              </Button>
            ),
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

        {/* Edit Variant Dialog */}
        <EditVariantDialog
          variant={selectedVariant}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            setSelectedVariant(null);
            refetch();
          }}
        />

        {/* Create Variant Dialog */}
        <CreateVariantDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          products={products}
          onSuccess={refetch}
        />

        {/* Floating Help Button */}
        <Button
          onClick={() => setShowHelpDrawer(true)}
          className="fixed bottom-4 right-4 h-10 w-10 rounded-full shadow-md hover:shadow-lg transition-all duration-200 z-50 bg-nidia-green hover:bg-nidia-green/90 text-white"
          size="sm"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* Help Drawer */}
        <Drawer open={showHelpDrawer} onOpenChange={setShowHelpDrawer} direction="right">
          <DrawerContent direction="right" className="h-full max-w-md">
            <DrawerHeader className="text-left border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-nidia-green/10 dark:bg-nidia-green/20">
                  <Info className="h-5 w-5 text-nidia-green" />
                </div>
                <div>
                  <DrawerTitle className="text-lg font-semibold">¿Qué son las Variantes?</DrawerTitle>
                  <DrawerDescription className="text-xs mt-1">
                    Información sobre variantes de productos
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-foreground leading-relaxed mb-3">
                    Una <strong className="text-nidia-green">Variante</strong> es una versión específica de un producto 
                    que difiere en características como tamaño, color, material u otras opciones. Las variantes permiten 
                    ofrecer múltiples opciones del mismo producto sin crear productos separados.
                  </p>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-foreground leading-relaxed">
                      <strong className="text-blue-600">Ejemplo práctico:</strong> Una camiseta puede tener variantes por 
                      <strong> Color</strong> (Rojo, Azul, Negro) y <strong>Talla</strong> (S, M, L, XL). 
                      Esto genera variantes como &quot;Rojo - M&quot;, &quot;Azul - L&quot;, etc.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
                      <Palette className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Opciones de Variante</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Cada variante puede tener hasta 2 opciones configurables. Por ejemplo: 
                        <strong> Opción 1:</strong> Color → Rojo, <strong>Opción 2:</strong> Talla → M. 
                        Esto facilita la organización y búsqueda de variantes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-green-500/10 flex-shrink-0">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Ajuste de Precio</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Cada variante puede tener un <strong>ajuste de precio</strong> sobre el precio base del producto. 
                        Por ejemplo, si la talla XL cuesta más, puedes agregar un ajuste de +$5,000 a esa variante específica.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-orange-500/10 flex-shrink-0">
                      <Boxes className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Stock por Variante</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Cada variante tiene su propio <strong>inventario independiente</strong>. Puedes tener 50 unidades 
                        de &quot;Rojo - M&quot; y solo 10 de &quot;Azul - XL&quot;. Las alertas de stock bajo se calculan para cada variante.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                      <Ruler className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">SKU Único</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Cada variante tiene un <strong>SKU único</strong> para identificación en inventario y ventas. 
                        Si no especificas uno, el sistema lo genera automáticamente basándose en el SKU del producto padre.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-3">
                    <strong>Casos de uso comunes:</strong>
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-nidia-green"></span>
                      <span><strong>Ropa:</strong> Color, Talla, Material</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-nidia-green"></span>
                      <span><strong>Electrónicos:</strong> Capacidad, Color, Modelo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-nidia-green"></span>
                      <span><strong>Alimentos:</strong> Tamaño, Sabor, Presentación</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-nidia-green"></span>
                      <span><strong>Muebles:</strong> Color, Material, Tamaño</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Tip:</strong> Usa el botón &quot;Nueva Variante&quot; para agregar variantes manualmente, 
                    o crea variantes en masa desde la página de edición del producto.
                  </p>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </ErrorBoundary>
  );
}

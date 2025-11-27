'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Package,
  Save,
  X,
  Grid3x3,
  AlertCircle
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { TenantLink } from '@/components/ui/tenant-link';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { productsApi, variantsApi, ProductVariant, BulkCreateVariantsDto } from '@/lib/api/products';
import { DataTable, DataTableAction } from '@/components/ui/data-table';
import { QueryLoading } from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';

// Define columns for DataTable
function getColumns(productPrice: number): ColumnDef<ProductVariant>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Variante',
      cell: ({ row }) => {
        const variant = row.original;
        return (
          <div>
            <div className="font-semibold text-foreground">{variant.name}</div>
            {variant.sku && (
              <div className="text-sm text-muted-foreground">SKU: {variant.sku}</div>
            )}
            {variant.option1Name && variant.option1Value && (
              <div className="text-xs text-muted-foreground mt-1">
                {variant.option1Name}: {variant.option1Value}
                {variant.option2Name && variant.option2Value && ` • ${variant.option2Name}: ${variant.option2Value}`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'Precio',
      cell: ({ row }) => {
        const variant = row.original;
        const finalPrice = productPrice + (variant.priceAdjustment || 0);
        return (
          <div>
            <div className="font-semibold text-foreground">
              ${finalPrice.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {variant.priceAdjustment !== 0 && (
              <div className="text-xs text-muted-foreground">
                {variant.priceAdjustment > 0 ? '+' : ''}${variant.priceAdjustment.toFixed(2)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'stockQuantity',
      header: 'Stock',
      cell: ({ row }) => {
        const variant = row.original;
        const stock = variant.stockQuantity || 0;
        const isLowStock = stock > 0 && stock <= 5;
        const isOutOfStock = stock === 0;
        return (
          <div>
            <div className={`font-semibold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
              {stock} unidades
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs font-medium px-2.5 py-0.5">
            {isActive ? 'Activa' : 'Inactiva'}
          </Badge>
        );
      },
    },
  ];
}

// Bulk Create Dialog
function BulkCreateVariantsDialog({ 
  productId, 
  productPrice,
  open, 
  onOpenChange,
  onSuccess 
}: { 
  productId: string;
  productPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [option1Name, setOption1Name] = useState('');
  const [option1Values, setOption1Values] = useState('');
  const [option2Name, setOption2Name] = useState('');
  const [option2Values, setOption2Values] = useState('');
  const [defaultPriceAdjustment, setDefaultPriceAdjustment] = useState('0');
  const [defaultStockQuantity, setDefaultStockQuantity] = useState('0');

  const bulkCreateMutation = useMutation({
    mutationFn: async (data: BulkCreateVariantsDto) => {
      const response = await variantsApi.bulkCreate(productId, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', productId] });
      toast.success('Variantes creadas exitosamente');
      onOpenChange(false);
      // Reset form
      setOption1Name('');
      setOption1Values('');
      setOption2Name('');
      setOption2Values('');
      setDefaultPriceAdjustment('0');
      setDefaultStockQuantity('0');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear las variantes');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!option1Name.trim()) {
      toast.error('El nombre de la opción 1 es requerido');
      return;
    }

    const values1 = option1Values.split(',').map(v => v.trim()).filter(v => v);
    if (values1.length === 0) {
      toast.error('Debes agregar al menos un valor para la opción 1');
      return;
    }

    const payload: BulkCreateVariantsDto = {
      productId,
      option1: {
        name: option1Name.trim(),
        values: values1,
      },
      defaultPriceAdjustment: defaultPriceAdjustment ? parseFloat(defaultPriceAdjustment) : undefined,
      defaultStockQuantity: defaultStockQuantity ? parseFloat(defaultStockQuantity) : undefined,
    };

    if (option2Name.trim() && option2Values.trim()) {
      const values2 = option2Values.split(',').map(v => v.trim()).filter(v => v);
      if (values2.length > 0) {
        payload.option2 = {
          name: option2Name.trim(),
          values: values2,
        };
      }
    }

    await bulkCreateMutation.mutateAsync(payload);
  };

  // Calculate total variants that will be created
  const totalVariants = useMemo(() => {
    const values1 = option1Values.split(',').map(v => v.trim()).filter(v => v).length;
    const values2 = option2Values.split(',').map(v => v.trim()).filter(v => v).length;
    if (values2 > 0) {
      return values1 * values2;
    }
    return values1;
  }, [option1Values, option2Values]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear Variantes en Masa</DialogTitle>
            <DialogDescription>
              Crea múltiples variantes combinando opciones (ej: Tallas × Colores)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Option 1 */}
            <div className="space-y-2">
              <Label htmlFor="option1Name">Opción 1 (ej: Talla, Color) *</Label>
              <Input
                id="option1Name"
                placeholder="Ej: Talla"
                value={option1Name}
                onChange={(e) => setOption1Name(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="option1Values">Valores de Opción 1 (separados por comas) *</Label>
              <Textarea
                id="option1Values"
                placeholder="Ej: S, M, L, XL"
                value={option1Values}
                onChange={(e) => setOption1Values(e.target.value)}
                rows={2}
                required
              />
              <p className="text-xs text-muted-foreground">
                Separa los valores con comas. Ejemplo: S, M, L, XL
              </p>
            </div>

            {/* Option 2 (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="option2Name">Opción 2 (Opcional, ej: Color)</Label>
              <Input
                id="option2Name"
                placeholder="Ej: Color"
                value={option2Name}
                onChange={(e) => setOption2Name(e.target.value)}
              />
            </div>

            {option2Name && (
              <div className="space-y-2">
                <Label htmlFor="option2Values">Valores de Opción 2 (separados por comas)</Label>
                <Textarea
                  id="option2Values"
                  placeholder="Ej: Rojo, Azul, Verde"
                  value={option2Values}
                  onChange={(e) => setOption2Values(e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Separa los valores con comas. Ejemplo: Rojo, Azul, Verde
                </p>
              </div>
            )}

            {/* Defaults */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultPriceAdjustment">Ajuste de Precio por Defecto</Label>
                <Input
                  id="defaultPriceAdjustment"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={defaultPriceAdjustment}
                  onChange={(e) => setDefaultPriceAdjustment(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ajuste adicional al precio base (puede ser negativo)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultStockQuantity">Stock Inicial por Defecto</Label>
                <Input
                  id="defaultStockQuantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={defaultStockQuantity}
                  onChange={(e) => setDefaultStockQuantity(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Stock inicial para todas las variantes
                </p>
              </div>
            </div>

            {/* Preview */}
            {totalVariants > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Variantes a crear:</span>
                  <span className="text-lg font-bold text-nidia-green">{totalVariants}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {option2Name && option2Values.split(',').filter(v => v.trim()).length > 0
                    ? `Combinaciones de ${option1Name} × ${option2Name}`
                    : `Una variante por cada valor de ${option1Name}`}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={bulkCreateMutation.isPending || totalVariants === 0}>
              {bulkCreateMutation.isPending ? 'Creando...' : `Crear ${totalVariants} Variantes`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Single Variant Dialog
function VariantDialog({ 
  productId,
  productPrice,
  variant,
  open, 
  onOpenChange,
  onSuccess 
}: { 
  productId: string;
  productPrice: number;
  variant?: ProductVariant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!variant;
  const [formData, setFormData] = useState({
    name: variant?.name || '',
    sku: variant?.sku || '',
    option1Name: variant?.option1Name || '',
    option1Value: variant?.option1Value || '',
    option2Name: variant?.option2Name || '',
    option2Value: variant?.option2Value || '',
    priceAdjustment: variant?.priceAdjustment?.toString() || '0',
    stockQuantity: variant?.stockQuantity?.toString() || '0',
    isActive: variant?.isActive ?? true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await variantsApi.create(productId, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', productId] });
      toast.success('Variante creada exitosamente');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear la variante');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await variantsApi.update(productId, variant!.id, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', productId] });
      toast.success('Variante actualizada exitosamente');
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

    const payload: any = {
      name: formData.name.trim(),
      sku: formData.sku.trim() || undefined,
      option1Name: formData.option1Name.trim() || undefined,
      option1Value: formData.option1Value.trim() || undefined,
      option2Name: formData.option2Name.trim() || undefined,
      option2Value: formData.option2Value.trim() || undefined,
      priceAdjustment: parseFloat(formData.priceAdjustment) || 0,
      stockQuantity: parseFloat(formData.stockQuantity) || 0,
      isActive: formData.isActive,
    };

    if (isEdit) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const finalPrice = productPrice + (parseFloat(formData.priceAdjustment) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Variante' : 'Nueva Variante'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Actualiza la información de la variante' : 'Crea una nueva variante para este producto'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Rojo - Grande"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  placeholder="Se genera automáticamente si se deja vacío"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="option1Name">Opción 1 - Nombre</Label>
                <Input
                  id="option1Name"
                  placeholder="Ej: Color"
                  value={formData.option1Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, option1Name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="option1Value">Opción 1 - Valor</Label>
                <Input
                  id="option1Value"
                  placeholder="Ej: Rojo"
                  value={formData.option1Value}
                  onChange={(e) => setFormData(prev => ({ ...prev, option1Value: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="option2Name">Opción 2 - Nombre</Label>
                <Input
                  id="option2Name"
                  placeholder="Ej: Talla"
                  value={formData.option2Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, option2Name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="option2Value">Opción 2 - Valor</Label>
                <Input
                  id="option2Value"
                  placeholder="Ej: Grande"
                  value={formData.option2Value}
                  onChange={(e) => setFormData(prev => ({ ...prev, option2Value: e.target.value }))}
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
                  placeholder="0.00"
                  value={formData.priceAdjustment}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceAdjustment: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Precio base: ${productPrice.toFixed(2)} → Final: ${finalPrice.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProductVariantsPage() {
  const params = useParams();
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  const productId = params.id as string;
  
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();

  // Fetch product
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['products', productId],
    queryFn: async () => {
      const response = await productsApi.getById(productId);
      return response;
    },
    enabled: !!productId,
  });

  // Fetch variants
  const { data: variantsData, isLoading: variantsLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const response = await variantsApi.getByProduct(productId);
      return response;
    },
    enabled: !!productId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (variantId: string) => {
      const response = await variantsApi.delete(productId, variantId);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', productId] });
      toast.success('Variante eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar la variante');
    },
  });

  const product = productData?.data;
  const variants = variantsData?.data?.data || [];
  const productPrice = product?.price || 0;
  const columns = useMemo(() => getColumns(productPrice), [productPrice]);

  // Actions for DataTable
  const actions: DataTableAction<ProductVariant>[] = [
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (variant) => {
        setSelectedVariant(variant);
        setVariantDialogOpen(true);
      },
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      separator: true,
      onClick: (variant) => {
        if (confirm(`¿Estás seguro de eliminar la variante "${variant.name}"?`)) {
          deleteMutation.mutate(variant.id);
        }
      },
    },
  ];

  if (productLoading) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <SectionHeader title="Cargando..." />
          <QueryLoading isLoading={true} />
        </div>
      </ErrorBoundary>
    );
  }

  if (!product) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <SectionHeader title="Producto no encontrado" />
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">El producto solicitado no existe</p>
              <Button asChild className="mt-4">
                <TenantLink href={route('/products/catalog')}>
                  Volver al Catálogo
                </TenantLink>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title={`Variantes: ${product.name}`}
          description={`Gestiona las variantes del producto (tallas, colores, etc.)`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <TenantLink href={route(`/products/catalog/${productId}`)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </TenantLink>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setBulkCreateOpen(true)}>
                <Grid3x3 className="h-4 w-4 mr-2" />
                Crear en Masa
              </Button>
              <Button size="sm" onClick={() => {
                setSelectedVariant(undefined);
                setVariantDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Variante
              </Button>
            </div>
          }
        />

        {/* Product Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Producto</div>
                <div className="font-semibold">{product.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">SKU</div>
                <div className="font-semibold">{product.sku}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Precio Base</div>
                <div className="font-semibold">${product.price.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variants Table */}
        <div className="rounded-lg border bg-card">
          <div className="p-6">
            <QueryLoading
              isLoading={variantsLoading}
              isError={false}
              error={null}
              emptyFallback={null}
            >
              <DataTable
                data={variants}
                columns={columns}
                searchPlaceholder="Buscar variantes..."
                emptyMessage="No hay variantes"
                emptyDescription="Crea variantes para este producto (tallas, colores, etc.)"
                actions={actions}
                enableColumnVisibility={true}
                enableColumnSizing={true}
                getRowId={(row) => row.id}
                showSearch={false}
                showPagination={false}
              />
            </QueryLoading>
          </div>
        </div>

        {/* Dialogs */}
        <BulkCreateVariantsDialog
          productId={productId}
          productPrice={productPrice}
          open={bulkCreateOpen}
          onOpenChange={setBulkCreateOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
          }}
        />

        <VariantDialog
          productId={productId}
          productPrice={productPrice}
          variant={selectedVariant}
          open={variantDialogOpen}
          onOpenChange={(open) => {
            setVariantDialogOpen(open);
            if (!open) setSelectedVariant(undefined);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
          }}
        />
      </div>
    </ErrorBoundary>
  );
}


'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent } from '@/components/ui/card';
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
  DollarSign,
  Percent,
  ArrowRight,
  Package,
  RefreshCw,
  TrendingUp,
  Calculator,
  Edit,
  X,
  Check,
  HelpCircle,
  Info,
  Tag,
  BarChart3,
  Layers,
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
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { productsApi, Product } from '@/lib/api/products';
import { Table } from '@/components/table';
import { TableRowAction } from '@/components/table/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';

// Edit Price Cell Component
function EditablePriceCell({ 
  product, 
  field, 
  onSave 
}: { 
  product: Product; 
  field: 'price' | 'cost';
  onSave: (productId: string, field: 'price' | 'cost', value: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(String(product[field] || 0));

  const handleSave = () => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onSave(product.id, field, numValue);
      setIsEditing(false);
    } else {
      toast.error('Ingresa un valor válido');
    }
  };

  const handleCancel = () => {
    setValue(String(product[field] || 0));
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-24"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    );
  }

  const displayValue = product[field];
  const hasValue = displayValue !== null && displayValue !== undefined && displayValue > 0;

  return (
    <div 
      className="flex items-center gap-2 cursor-pointer group"
      onClick={() => setIsEditing(true)}
    >
      {hasValue ? (
        <span className="font-semibold text-foreground">
          {formatCurrency(displayValue)}
        </span>
      ) : (
        <span className="text-muted-foreground text-sm">
          {field === 'cost' ? 'Agregar costo' : 'Sin precio'}
        </span>
      )}
      <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// Define columns for DataTable
function getColumns(onSavePrice: (productId: string, field: 'price' | 'cost', value: number) => void): ColumnDef<Product>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Producto',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-nidia-green/80 to-nidia-purple/80 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-foreground">{product.name}</div>
              <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'cost',
      header: 'Costo',
      cell: ({ row }) => {
        const product = row.original;
        // Siempre mostrar celda editable, incluso si cost es 0 o null
        return (
          <EditablePriceCell 
            product={product} 
            field="cost" 
            onSave={onSavePrice}
          />
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'Precio Venta',
      cell: ({ row }) => (
        <EditablePriceCell 
          product={row.original} 
          field="price" 
          onSave={onSavePrice}
        />
      ),
    },
    {
      id: 'margin',
      header: 'Margen',
      cell: ({ row }) => {
        const product = row.original;
        if (!product.cost || product.cost === 0) {
          return <span className="text-muted-foreground">-</span>;
        }
        const margin = ((product.price - product.cost) / product.price) * 100;
        const marginValue = product.price - product.cost;
        
        return (
          <div className="flex flex-col">
            <span className={`font-semibold ${margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
              {margin.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">
              {formatCurrency(marginValue)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'discountPercentage',
      header: 'Descuento',
      cell: ({ row }) => {
        const product = row.original;
        const discount = product.discountPercentage || 0;
        if (discount === 0) {
          return <span className="text-sm text-muted-foreground">Sin descuento</span>;
        }
        const discountedPrice = product.price * (1 - discount / 100);
        return (
          <div className="flex flex-col">
            <Badge variant="secondary" className="text-green-600 w-fit">
              {discount}% OFF
            </Badge>
            <span className="text-xs text-muted-foreground">
              Precio final: {formatCurrency(discountedPrice)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const typeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
          product: { label: 'Producto', variant: 'default' },
          service: { label: 'Servicio', variant: 'secondary' },
          combo: { label: 'Combo', variant: 'outline' },
        };
        const config = typeConfig[row.original.type] || typeConfig.product;
        return (
          <Badge variant={config.variant} className="text-xs">
            {config.label}
          </Badge>
        );
      },
    },
  ];
}

// Edit Single Product Dialog
function EditProductPriceDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    price: 0,
    cost: 0,
    discountPercentage: 0,
  });

  // Update form when product changes
  useMemo(() => {
    if (product) {
      setFormData({
        price: product.price || 0,
        cost: product.cost || 0,
        discountPercentage: product.discountPercentage || 0,
      });
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error('No product selected');
      return productsApi.update(product.id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Precios actualizados correctamente');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar los precios');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync();
  };

  const margin = formData.cost > 0 
    ? ((formData.price - formData.cost) / formData.price) * 100 
    : 0;

  const finalPrice = formData.price * (1 - (formData.discountPercentage || 0) / 100);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Precios</DialogTitle>
            <DialogDescription>
              {product.name} ({product.sku})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Costo</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio de Venta *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Porcentaje de Descuento</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: parseFloat(e.target.value) || 0 }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Price Preview */}
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="text-sm font-medium mb-2">Vista Previa</div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Margen de Ganancia</span>
                <span className={`font-semibold ${margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {margin.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ganancia por Unidad</span>
                <span className="font-semibold">
                  {formatCurrency(formData.price - formData.cost)}
                </span>
              </div>

              {formData.discountPercentage > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Precio Final (con descuento)</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(finalPrice)}
                  </span>
                </div>
              )}
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

// Bulk Price Update Dialog
function BulkPriceUpdateDialog({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [updateType, setUpdateType] = useState<'percentage' | 'fixed' | 'set'>('percentage');
  const [value, setValue] = useState('');
  const [applyTo, setApplyTo] = useState<'price' | 'cost' | 'both'>('price');

  const bulkUpdateMutation = useMutation({
    mutationFn: async () => {
      const productIds = selectedProducts.map(p => p.id);
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
        throw new Error('El valor debe ser un número válido');
      }

      return await productsApi.bulkUpdatePrices({
        productIds,
        updateType,
        value: numValue,
        applyTo,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Precios actualizados para ${selectedProducts.length} productos`);
      onOpenChange(false);
      setValue('');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar los precios');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || isNaN(parseFloat(value))) {
      toast.error('Ingresa un valor válido');
      return;
    }
    await bulkUpdateMutation.mutateAsync();
  };

  const preview = useMemo(() => {
    if (!value || isNaN(parseFloat(value))) return null;
    const numValue = parseFloat(value);
    const sampleProduct = selectedProducts[0];
    if (!sampleProduct) return null;

    let newPrice = sampleProduct.price;
    let newCost = sampleProduct.cost || 0;

    if (updateType === 'percentage') {
      if (applyTo === 'price' || applyTo === 'both') newPrice = sampleProduct.price * (1 + numValue / 100);
      if (applyTo === 'cost' || applyTo === 'both') newCost = (sampleProduct.cost || 0) * (1 + numValue / 100);
    } else if (updateType === 'fixed') {
      if (applyTo === 'price' || applyTo === 'both') newPrice = sampleProduct.price + numValue;
      if (applyTo === 'cost' || applyTo === 'both') newCost = (sampleProduct.cost || 0) + numValue;
    } else if (updateType === 'set') {
      if (applyTo === 'price' || applyTo === 'both') newPrice = numValue;
      if (applyTo === 'cost' || applyTo === 'both') newCost = numValue;
    }

    return { oldPrice: sampleProduct.price, newPrice, oldCost: sampleProduct.cost || 0, newCost };
  }, [value, updateType, applyTo, selectedProducts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Actualizar Precios en Masa</DialogTitle>
            <DialogDescription>
              Actualizarás los precios de {selectedProducts.length} producto{selectedProducts.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Tipo de Actualización</Label>
              <Select value={updateType} onValueChange={(value: any) => setUpdateType(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje (ej: +10% o -5%)</SelectItem>
                  <SelectItem value="fixed">Cantidad Fija (ej: +$1000 o -$500)</SelectItem>
                  <SelectItem value="set">Establecer Precio (ej: $50000)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aplicar a</Label>
              <Select value={applyTo} onValueChange={(value: any) => setApplyTo(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Precio de Venta</SelectItem>
                  <SelectItem value="cost">Costo</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">
                {updateType === 'percentage' ? 'Porcentaje' : updateType === 'fixed' ? 'Cantidad' : 'Precio'} *
              </Label>
              <div className="relative">
                {updateType === 'percentage' ? (
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                ) : (
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  placeholder={updateType === 'percentage' ? '10 (para +10%)' : '1000'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {updateType === 'percentage' && 'Usa valores negativos para reducir precios (ej: -10 para -10%)'}
                {updateType === 'fixed' && 'Usa valores negativos para reducir precios'}
                {updateType === 'set' && 'Todos los productos seleccionados tendrán este precio'}
              </p>
            </div>

            {preview && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="text-sm font-medium mb-3">Vista Previa (primer producto):</div>
                {(applyTo === 'price' || applyTo === 'both') && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Precio:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{formatCurrency(preview.oldPrice)}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className={`font-semibold ${preview.newPrice > preview.oldPrice ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(preview.newPrice)}
                      </span>
                    </div>
                  </div>
                )}
                {(applyTo === 'cost' || applyTo === 'both') && preview.oldCost > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Costo:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{formatCurrency(preview.oldCost)}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className={`font-semibold ${preview.newCost > preview.oldCost ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(preview.newCost)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={bulkUpdateMutation.isPending || !value}>
              {bulkUpdateMutation.isPending ? 'Actualizando...' : `Actualizar ${selectedProducts.length} Productos`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Bulk Discount Dialog
function BulkDiscountDialog({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [discountPercentage, setDiscountPercentage] = useState('');

  const bulkDiscountMutation = useMutation({
    mutationFn: async () => {
      const productIds = selectedProducts.map(p => p.id);
      const discount = parseFloat(discountPercentage);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        throw new Error('El descuento debe ser un número entre 0 y 100');
      }
      return await productsApi.bulkUpdateDiscounts({ productIds, discountPercentage: discount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Descuento aplicado a ${selectedProducts.length} productos`);
      onOpenChange(false);
      setDiscountPercentage('');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al aplicar el descuento');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const discount = parseFloat(discountPercentage);
    if (!discountPercentage || isNaN(discount) || discount < 0 || discount > 100) {
      toast.error('El descuento debe estar entre 0 y 100%');
      return;
    }
    await bulkDiscountMutation.mutateAsync();
  };

  // Preview
  const preview = useMemo(() => {
    const discount = parseFloat(discountPercentage);
    if (isNaN(discount) || !selectedProducts[0]) return null;
    const product = selectedProducts[0];
    const newPrice = product.price * (1 - discount / 100);
    return { oldPrice: product.price, newPrice, discount };
  }, [discountPercentage, selectedProducts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Aplicar Descuento en Masa</DialogTitle>
            <DialogDescription>
              Aplicarás un descuento a {selectedProducts.length} producto{selectedProducts.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Porcentaje de Descuento *</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="10 (para 10% de descuento)"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Usa 0 para quitar el descuento de los productos seleccionados
              </p>
            </div>

            {preview && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="text-sm font-medium mb-3">Vista Previa (primer producto):</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Precio Original:</span>
                  <span className="font-semibold">{formatCurrency(preview.oldPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Descuento:</span>
                  <span className="font-semibold text-green-600">{preview.discount}%</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm text-muted-foreground">Precio Final:</span>
                  <span className="font-semibold text-lg">{formatCurrency(preview.newPrice)}</span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={bulkDiscountMutation.isPending || !discountPercentage}>
              {bulkDiscountMutation.isPending ? 'Aplicando...' : `Aplicar a ${selectedProducts.length} Productos`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PricingManagementPage() {
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState<Product[]>([]);
  const [bulkPriceDialogOpen, setBulkPriceDialogOpen] = useState(false);
  const [bulkDiscountDialogOpen, setBulkDiscountDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);

  const apiFilters = useMemo(() => ({
    page: 1,
    limit: 100,
    type: typeFilter !== 'all' ? typeFilter : undefined,
  }), [typeFilter]);

  const { data: productsData, isLoading, error, refetch } = useQuery({
    queryKey: ['products', 'pricing', apiFilters],
    queryFn: async () => productsApi.getAll(apiFilters),
  });

  const products = productsData?.data?.data || [];

  // Mutation for inline price updates
  const updatePriceMutation = useMutation({
    mutationFn: async ({ productId, field, value }: { productId: string; field: 'price' | 'cost'; value: number }) => {
      return productsApi.update(productId, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Precio actualizado');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar el precio');
    },
  });

  const handleSavePrice = (productId: string, field: 'price' | 'cost', value: number) => {
    updatePriceMutation.mutate({ productId, field, value });
  };

  const columns = useMemo(() => getColumns(handleSavePrice), []);

  // Row actions
  const rowActions: TableRowAction<Product>[] = useMemo(() => [
    {
      label: 'Editar Precios',
      icon: <Calculator className="h-4 w-4" />,
      onClick: (product) => {
        setSelectedProduct(product);
        setEditDialogOpen(true);
      },
    },
    {
      label: 'Ver en Catálogo',
      icon: <Package className="h-4 w-4" />,
      onClick: (product) => {
        window.location.href = route(`/products/catalog/${product.id}`);
      },
    },
    {
      label: 'Quitar Descuento',
      icon: <X className="h-4 w-4" />,
      variant: 'warning',
      separator: true,
      disabled: (product) => !product.discountPercentage || product.discountPercentage === 0,
      onClick: async (product) => {
        try {
          await productsApi.update(product.id, { discountPercentage: 0 });
          queryClient.invalidateQueries({ queryKey: ['products'] });
          toast.success('Descuento removido');
        } catch (error: any) {
          toast.error(error?.response?.data?.message || 'Error al quitar descuento');
        }
      },
    },
  ], [route, queryClient]);

  const statsData = useMemo(() => {
    const total = products.length;
    const withDiscount = products.filter((p: Product) => (p.discountPercentage || 0) > 0).length;
    const avgPrice = total > 0 ? products.reduce((sum: number, p: Product) => sum + p.price, 0) / total : 0;
    const avgMargin = products.filter((p: Product) => p.cost && p.cost > 0).length > 0
      ? products
          .filter((p: Product) => p.cost && p.cost > 0)
          .reduce((sum: number, p: Product) => sum + ((p.price - (p.cost || 0)) / p.price) * 100, 0) / 
        products.filter((p: Product) => p.cost && p.cost > 0).length
      : 0;
    
    return [
      { 
        label: 'Total Productos', 
        value: total, 
        description: 'En el catálogo', 
        icon: <Package className="h-4 w-4 text-muted-foreground" /> 
      },
      { 
        label: 'Con Descuento', 
        value: withDiscount, 
        description: 'Productos en promoción', 
        icon: <Percent className="h-4 w-4 text-green-500" /> 
      },
      { 
        label: 'Precio Promedio', 
        value: formatCurrency(avgPrice), 
        description: 'De todos los productos', 
        icon: <TrendingUp className="h-4 w-4 text-blue-500" /> 
      },
      { 
        label: 'Margen Promedio', 
        value: `${avgMargin.toFixed(1)}%`, 
        description: 'De productos con costo', 
        icon: <Calculator className="h-4 w-4 text-purple-500" /> 
      },
    ];
  }, [products]);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <SectionHeader
          title="Gestión de Precios"
          description="Actualiza precios y descuentos de múltiples productos a la vez"
          actions={
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          }
        />

        {/* Selected Products Actions */}
        {selectedRows.length > 0 && (
          <Card className="border-nidia-green/20 bg-nidia-green/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground mb-1">
                    {selectedRows.length} producto{selectedRows.length !== 1 ? 's' : ''} seleccionado{selectedRows.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Selecciona una acción para aplicar cambios masivos
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setBulkPriceDialogOpen(true)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Actualizar Precios
                  </Button>
                  <Button size="sm" onClick={() => setBulkDiscountDialogOpen(true)}>
                    <Percent className="h-4 w-4 mr-2" />
                    Aplicar Descuento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Table
          id="pricing-management"
          data={products}
          columns={columns}
          search={{
            enabled: true,
            placeholder: 'Buscar por nombre, SKU...',
          }}
          filters={[
            {
              key: 'type',
              label: 'Tipo',
              type: 'select',
              options: [
                { value: 'all', label: 'Todos los tipos' },
                { value: 'product', label: 'Productos' },
                { value: 'service', label: 'Servicios' },
                { value: 'combo', label: 'Combos' },
              ],
            },
          ]}
          onFiltersChange={(filters) => {
            if (filters.type !== undefined) setTypeFilter(filters.type);
          }}
          rowActions={rowActions}
          stats={{
            enabled: true,
            stats: statsData,
          }}
          emptyState={{
            icon: <Package className="h-16 w-16 text-muted-foreground/50" />,
            title: 'No hay productos para gestionar',
            description: 'Agrega productos al catálogo para poder gestionar sus precios',
          }}
          isLoading={isLoading}
          isError={!!error}
          error={error as Error | null}
          onRetry={refetch}
          features={{
            columnVisibility: true,
            columnSizing: true,
            rowSelection: true,
          }}
          onRowSelectionChange={setSelectedRows}
          getRowId={(row) => row.id}
        />

        {/* Dialogs */}
        <BulkPriceUpdateDialog
          open={bulkPriceDialogOpen}
          onOpenChange={setBulkPriceDialogOpen}
          selectedProducts={selectedRows}
          onSuccess={() => { setSelectedRows([]); refetch(); }}
        />

        <BulkDiscountDialog
          open={bulkDiscountDialogOpen}
          onOpenChange={setBulkDiscountDialogOpen}
          selectedProducts={selectedRows}
          onSuccess={() => { setSelectedRows([]); refetch(); }}
        />

        <EditProductPriceDialog
          product={selectedProduct}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            setSelectedProduct(null);
            refetch();
          }}
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
                  <DrawerTitle className="text-lg font-semibold">Gestión de Precios</DrawerTitle>
                  <DrawerDescription className="text-xs mt-1">
                    Información sobre precios, costos y descuentos
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-foreground leading-relaxed mb-3">
                    El módulo de <strong className="text-nidia-green">Gestión de Precios</strong> te permite administrar 
                    eficientemente los precios de venta, costos y descuentos de todos tus productos desde un solo lugar, 
                    incluyendo actualizaciones masivas.
                  </p>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-foreground leading-relaxed">
                      <strong className="text-blue-600">Tip:</strong> Haz clic directamente sobre un precio en la tabla 
                      para editarlo rápidamente. Presiona <strong>Enter</strong> para guardar o <strong>Escape</strong> para cancelar.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-green-500/10 flex-shrink-0">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Precio de Venta</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Es el precio que cobra al cliente. Puede editarse individualmente o en masa. 
                        Es la base para calcular el <strong>margen de ganancia</strong> y aplicar descuentos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-orange-500/10 flex-shrink-0">
                      <Calculator className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Costo</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        El costo de adquisición o producción del producto. Usado para calcular el 
                        <strong> margen de ganancia</strong>. No es visible para los clientes, solo para gestión interna.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Margen de Ganancia</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Se calcula como <code className="bg-muted px-1 rounded">(Precio - Costo) / Precio × 100</code>. 
                        Un margen del 30% o más se considera saludable (verde), entre 15-30% es moderado (amarillo), 
                        y menos de 15% puede ser bajo (rojo).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-pink-500/10 flex-shrink-0">
                      <Tag className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Descuentos</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Porcentaje de descuento que se aplica al precio de venta. El <strong>precio final</strong> se 
                        calcula como: Precio × (1 - Descuento%). Útil para promociones y ofertas temporales.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                      <Layers className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Actualización Masiva</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Selecciona múltiples productos con los checkboxes para aplicar cambios en masa:
                      </p>
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-nidia-green"></span>
                          <strong>Porcentaje:</strong> +10% aumenta, -10% reduce
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-nidia-green"></span>
                          <strong>Cantidad Fija:</strong> +$5000 o -$2000
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-nidia-green"></span>
                          <strong>Establecer:</strong> Todos al mismo precio
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-3">
                    <strong>Estrategias de precios comunes:</strong>
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span><strong>Cost-plus:</strong> Costo + margen fijo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span><strong>Competitivo:</strong> Basado en competidores</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      <span><strong>Premium:</strong> Precio alto para posicionamiento</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                      <span><strong>Penetración:</strong> Precio bajo para ganar mercado</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Nota:</strong> Los cambios de precios se aplican inmediatamente y afectan a las nuevas 
                    ventas. Las órdenes existentes mantienen sus precios originales.
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

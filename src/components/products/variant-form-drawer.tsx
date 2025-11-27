'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Product, ProductVariant } from '@/lib/api/products';

// Extended variant interface with minStock
interface ExtendedVariant extends ProductVariant {
  minStock?: number;
}
import { variantsApi } from '@/lib/api/products';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface VariantFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  variant?: ExtendedVariant | null;
  productId?: string;
  onSuccess?: () => void;
}

export function VariantFormDrawer({
  open,
  onOpenChange,
  products,
  variant,
  productId: initialProductId,
  onSuccess,
}: VariantFormDrawerProps) {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState(initialProductId || '');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    priceAdjustment: 0,
    stockQuantity: 0,
    minStock: 0,
    option1Name: '',
    option1Value: '',
    option2Name: '',
    option2Value: '',
  });

  // Reset form when drawer opens/closes or variant changes
  useEffect(() => {
    if (open) {
      if (variant) {
        // Edit mode
        setSelectedProductId(variant.productId);
        setFormData({
          name: variant.name || '',
          sku: variant.sku || '',
          priceAdjustment: variant.priceAdjustment || 0,
          stockQuantity: variant.stockQuantity || 0,
          minStock: variant.minStock || 0,
          option1Name: variant.option1Name || '',
          option1Value: variant.option1Value || '',
          option2Name: variant.option2Name || '',
          option2Value: variant.option2Value || '',
        });
      } else {
        // Create mode
        setSelectedProductId(initialProductId || '');
        setFormData({
          name: '',
          sku: '',
          priceAdjustment: 0,
          stockQuantity: 0,
          minStock: 0,
          option1Name: '',
          option1Value: '',
          option2Name: '',
          option2Value: '',
        });
      }
    }
  }, [open, variant, initialProductId]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProductId) throw new Error('Selecciona un producto');
      return variantsApi.create(selectedProductId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Variante creada correctamente');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear la variante');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!variant || !selectedProductId) throw new Error('Datos incompletos');
      return variantsApi.update(selectedProductId, variant.id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
    
    if (!selectedProductId) {
      toast.error('Selecciona un producto');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (variant) {
      await updateMutation.mutateAsync();
    } else {
      await createMutation.mutateAsync();
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const isPending = createMutation.isPending || updateMutation.isPending;
  const isEditMode = !!variant;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DrawerHeader className="border-b">
            <DrawerTitle>{isEditMode ? 'Editar Variante' : 'Nueva Variante'}</DrawerTitle>
            <DrawerDescription>
              {isEditMode 
                ? 'Modifica los datos de la variante'
                : 'Crea una nueva variante para un producto existente'}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="space-y-2">
                <Label htmlFor="product-select">Producto *</Label>
                <Select 
                  value={selectedProductId} 
                  onValueChange={setSelectedProductId}
                  disabled={isEditMode || isPending}
                >
                  <SelectTrigger id="product-select">
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.length === 0 ? (
                      <SelectItem value="no-products" disabled>
                        No hay productos disponibles
                      </SelectItem>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} {product.sku && `(${product.sku})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {products.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Primero debes crear productos en el catálogo
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Rojo - Grande"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Auto-generado si vacío"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="option1Name">Opción 1 (Nombre)</Label>
                  <Input
                    id="option1Name"
                    value={formData.option1Name}
                    onChange={(e) => setFormData(prev => ({ ...prev, option1Name: e.target.value }))}
                    placeholder="Ej: Color"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="option1Value">Opción 1 (Valor)</Label>
                  <Input
                    id="option1Value"
                    value={formData.option1Value}
                    onChange={(e) => setFormData(prev => ({ ...prev, option1Value: e.target.value }))}
                    placeholder="Ej: Rojo"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="option2Name">Opción 2 (Nombre)</Label>
                  <Input
                    id="option2Name"
                    value={formData.option2Name}
                    onChange={(e) => setFormData(prev => ({ ...prev, option2Name: e.target.value }))}
                    placeholder="Ej: Talla"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="option2Value">Opción 2 (Valor)</Label>
                  <Input
                    id="option2Value"
                    value={formData.option2Value}
                    onChange={(e) => setFormData(prev => ({ ...prev, option2Value: e.target.value }))}
                    placeholder="Ej: Grande"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceAdjustment">Ajuste de Precio</Label>
                  <Input
                    id="priceAdjustment"
                    type="number"
                    step="0.01"
                    value={formData.priceAdjustment}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceAdjustment: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    disabled={isPending}
                  />
                  {selectedProduct && (
                    <p className="text-xs text-muted-foreground">
                      Precio base: {formatCurrency(selectedProduct.price)}
                      {formData.priceAdjustment !== 0 && (
                        <span className="ml-2">
                          → {formatCurrency(selectedProduct.price + formData.priceAdjustment)}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Inicial</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">Stock Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Se activará una alerta cuando el stock esté por debajo de este valor
                </p>
              </div>
            </div>
          </div>
          
          <DrawerFooter className="border-t">
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !selectedProductId || !formData.name.trim()}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Guardando...' : 'Creando...'}
                  </>
                ) : (
                  isEditMode ? 'Guardar Cambios' : 'Crear Variante'
                )}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}


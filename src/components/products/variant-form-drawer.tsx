'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SmartSelect } from '@/components/ui/smart-select';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Product, ProductVariant, variantsApi, attributesApi, Attribute } from '@/lib/api/products';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Plus, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Extended variant interface with minStock
interface ExtendedVariant extends ProductVariant {
  minStock?: number;
}

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
  
  // Fetch global attributes
  const { data: attributesData } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => attributesApi.getAll(),
    enabled: open, // Only fetch when drawer is open
  });

  const attributes = useMemo(() => attributesData?.data || [], [attributesData]);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    priceAdjustment: null as number | null,
    stockQuantity: 0,
    minStock: 0,
    // We still use these keys to map to backend, but UI will use attribute selectors
    option1Name: '',
    option1Value: '',
    option2Name: '',
    option2Value: '',
  });

  // Estado para el input de ajuste de precio (formato de texto)
  const [priceAdjustmentInput, setPriceAdjustmentInput] = useState('');
  
  // Estados para inputs numéricos (permiten estar vacíos)
  const [stockQuantityInput, setStockQuantityInput] = useState<string>('');
  const [minStockInput, setMinStockInput] = useState<string>('');

  // State for selected attributes in the UI
  const [selectedAttr1, setSelectedAttr1] = useState<string>('');
  const [selectedAttr2, setSelectedAttr2] = useState<string>('');

  // Update option names when attribute selection changes
  useEffect(() => {
    if (selectedAttr1) {
      const attr = attributes.find((a: Attribute) => a.name === selectedAttr1);
      if (attr) {
        setFormData(prev => ({ ...prev, option1Name: attr.name }));
      }
    } else if (!variant) { // Only clear if not editing existing variant
       setFormData(prev => ({ ...prev, option1Name: '' }));
    }
  }, [selectedAttr1, attributes, variant]);

  useEffect(() => {
    if (selectedAttr2 && selectedAttr2 !== 'none') {
      const attr = attributes.find((a: Attribute) => a.name === selectedAttr2);
      if (attr) {
        setFormData(prev => ({ ...prev, option2Name: attr.name }));
      }
    } else if (!variant) {
       setFormData(prev => ({ ...prev, option2Name: '', option2Value: '' }));
    }
  }, [selectedAttr2, attributes, variant]);

  // Get available values for selected attributes
  const attr1Values = useMemo(() => {
    const attr = attributes.find((a: Attribute) => a.name === selectedAttr1);
    return attr?.values || [];
  }, [selectedAttr1, attributes]);

  const attr2Values = useMemo(() => {
    const attr = attributes.find((a: Attribute) => a.name === selectedAttr2);
    return attr?.values || [];
  }, [selectedAttr2, attributes]);


  // Reset form when drawer opens/closes or variant changes
  useEffect(() => {
    if (open) {
      if (variant) {
        // Edit mode
        setSelectedProductId(variant.productId);
        const adjustment = variant.priceAdjustment || null;
        setFormData({
          name: variant.name || '',
          sku: variant.sku || '',
          priceAdjustment: adjustment,
          stockQuantity: variant.stockQuantity || 0,
          minStock: variant.minStock || 0,
          option1Name: variant.option1Name || '',
          option1Value: variant.option1Value || '',
          option2Name: variant.option2Name || '',
          option2Value: variant.option2Value || '',
        });
        setPriceAdjustmentInput(adjustment !== null && adjustment !== 0 ? formatCurrency(adjustment) : '');
        setStockQuantityInput(variant.stockQuantity ? variant.stockQuantity.toString() : '');
        setMinStockInput(variant.minStock ? variant.minStock.toString() : '');
        // Try to match existing options to attributes
        if (variant.option1Name) setSelectedAttr1(variant.option1Name);
        if (variant.option2Name) setSelectedAttr2(variant.option2Name);
      } else {
        // Create mode
        setSelectedProductId(initialProductId || '');
        setFormData({
          name: '',
          sku: '',
          priceAdjustment: null,
          stockQuantity: 0,
          minStock: 0,
          option1Name: '',
          option1Value: '',
          option2Name: '',
          option2Value: '',
        });
        setPriceAdjustmentInput('');
        setStockQuantityInput('');
        setMinStockInput('');
        setSelectedAttr1('');
        setSelectedAttr2('');
      }
    }
  }, [open, variant, initialProductId]);

  // Auto-generate name based on options if name is empty or auto-generated
  useEffect(() => {
    if (!variant && formData.option1Value) {
        const newName = [formData.option1Value, formData.option2Value].filter(Boolean).join(' - ');
        if (newName) {
            setFormData(prev => ({ ...prev, name: newName }));
        }
    }
  }, [formData.option1Value, formData.option2Value, variant]);

  // Función para parsear el valor monetario ingresado
  const parsePriceAdjustment = (value: string): number | null => {
    if (!value || value.trim() === '') return null;
    // Remover símbolos de moneda, espacios y comas
    const cleaned = value.replace(/[$\s,]/g, '').trim();
    if (cleaned === '') return null;
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProductId) throw new Error('Selecciona un producto');
      // Solo enviar los campos que el backend espera, sin productId (va en la URL)
      const dataToSend = {
        name: formData.name,
        sku: formData.sku || undefined,
        priceAdjustment: formData.priceAdjustment ?? 0,
        stockQuantity: parseInt(stockQuantityInput) || 0,
        option1Name: formData.option1Name || undefined,
        option1Value: formData.option1Value || undefined,
        option2Name: formData.option2Name || undefined,
        option2Value: formData.option2Value || undefined,
        isActive: true,
      };
      return variantsApi.create(selectedProductId, dataToSend);
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con variantes para actualización en tiempo real
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'for-variants-filter'] });
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
      // Solo enviar los campos que el backend espera
      const dataToSend = {
        name: formData.name,
        sku: formData.sku || undefined,
        priceAdjustment: formData.priceAdjustment ?? 0,
        stockQuantity: parseInt(stockQuantityInput) || 0,
        option1Name: formData.option1Name || undefined,
        option1Value: formData.option1Value || undefined,
        option2Name: formData.option2Name || undefined,
        option2Value: formData.option2Value || undefined,
        isActive: variant.isActive,
      };
      return variantsApi.update(selectedProductId, variant.id, dataToSend);
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con variantes para actualización en tiempo real
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'for-variants-filter'] });
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
    
    if (!selectedAttr1 || !formData.option1Value) {
      toast.error('Debes seleccionar al menos un atributo y su valor');
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
    <TooltipProvider>
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent direction="right" className="h-full flex flex-col">
          <DrawerHeader className="text-left border-b flex-shrink-0">
            <DrawerTitle>{isEditMode ? 'Editar Variante' : 'Nueva Variante'}</DrawerTitle>
            <DrawerDescription>
              {isEditMode 
                ? 'Modifica los datos de la variante'
                : 'Crea una nueva variante seleccionando atributos globales'}
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
            <div className="space-y-8 max-w-2xl mx-auto">
              
              {/* Product Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="product-select" className="text-sm font-medium">
                    Producto <span className="text-destructive">*</span>
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>Selecciona el producto base al que pertenecerá esta variante. El producto debe estar creado previamente en el catálogo.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <SmartSelect
                  id="product-select"
                  options={products.length === 0 
                    ? [{ value: '__no_products__', label: 'No hay productos disponibles', disabled: true }]
                    : products.map((product) => ({
                        value: product.id || '__empty__',
                        label: `${product.name}${product.sku ? ` (${product.sku})` : ''}`,
                      }))
                  }
                  value={selectedProductId || undefined}
                  onValueChange={setSelectedProductId}
                  placeholder="Seleccionar producto"
                  searchPlaceholder="Buscar producto..."
                  emptyText="No hay productos disponibles"
                  disabled={isEditMode || isPending}
                />
              </div>

              {/* Attributes Section - Rediseñado con mejor UI */}
              {attributes.length === 0 ? (
                <div className="border rounded-lg p-6 bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay atributos disponibles. Crea atributos primero en la página de Atributos.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Attribute 1 - Required */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Atributo 1</Label>
                      <span className="text-xs text-muted-foreground">(Requerido)</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Selecciona un atributo global predefinido (ej: Color, Talla, Material). Debes crear los atributos primero en la página de Atributos.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="attr1-select" className="text-xs text-muted-foreground">
                            Seleccionar atributo
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p>Elige el tipo de atributo que define esta variante. Ejemplos: Color, Talla, Material, etc.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <SmartSelect
                          id="attr1-select"
                          options={attributes.map((attr: Attribute) => ({
                            value: attr.name || attr.id,
                            label: attr.name,
                          }))}
                          value={selectedAttr1 || undefined}
                          onValueChange={setSelectedAttr1}
                          placeholder="Seleccionar atributo"
                          searchPlaceholder="Buscar atributo..."
                          disabled={isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="value1-select" className="text-xs text-muted-foreground">
                            Seleccionar valor
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p>Selecciona el valor específico del atributo. Si el atributo no tiene valores predefinidos, puedes ingresarlo manualmente.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {selectedAttr1 && attr1Values.length > 0 ? (
                          <SmartSelect
                            id="value1-select"
                            options={attr1Values.map((val: { id: string; name: string; value?: string }) => {
                              const itemValue = val.name || val.id || `val_${val.id}`;
                              return {
                                value: itemValue,
                                label: val.name,
                                // Para mostrar el color, necesitamos un render personalizado, pero por ahora solo el label
                              };
                            }).filter((opt: { value: string; label: string }) => opt.value)}
                            value={formData.option1Value || undefined}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, option1Value: val }))}
                            placeholder="Seleccionar valor"
                            searchPlaceholder="Buscar valor..."
                            disabled={isPending || !selectedAttr1}
                          />
                        ) : (
                          <Input
                            id="value1-input"
                            value={formData.option1Value}
                            onChange={(e) => setFormData(prev => ({ ...prev, option1Value: e.target.value }))}
                            placeholder={selectedAttr1 ? "Ingresar valor" : "Selecciona un atributo primero"}
                            disabled={isPending || !selectedAttr1}
                            required
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Attribute 2 - Optional */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Atributo 2</Label>
                      <span className="text-xs text-muted-foreground">(Opcional)</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Opcionalmente puedes agregar un segundo atributo para crear variantes más específicas. Ejemplo: Color + Talla.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="attr2-select" className="text-xs text-muted-foreground">
                            Seleccionar atributo
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p>Elige un segundo atributo diferente al primero. Puedes dejar "Ninguno" si no necesitas un segundo atributo.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <SmartSelect
                          id="attr2-select"
                          options={[
                            { value: 'none', label: 'Ninguno' },
                            ...attributes
                              .filter((a: Attribute) => a.name !== selectedAttr1)
                              .map((attr: Attribute) => ({
                                value: attr.name || attr.id,
                                label: attr.name,
                              }))
                          ]}
                          value={selectedAttr2 || 'none'}
                          onValueChange={(val) => setSelectedAttr2(val === 'none' ? '' : val)}
                          placeholder="Ninguno"
                          searchPlaceholder="Buscar atributo..."
                          disabled={isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="value2-select" className="text-xs text-muted-foreground">
                            Seleccionar valor
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p>Selecciona el valor del segundo atributo. Solo disponible si has seleccionado un atributo.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {selectedAttr2 && selectedAttr2 !== 'none' && attr2Values.length > 0 ? (
                          <SmartSelect
                            id="value2-select"
                            options={attr2Values.map((val: { id: string; name: string; value?: string }) => {
                              const itemValue = val.name || val.id || `val_${val.id}`;
                              return {
                                value: itemValue,
                                label: val.name,
                              };
                            }).filter((opt: { value: string; label: string }) => opt.value)}
                            value={formData.option2Value || undefined}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, option2Value: val }))}
                            placeholder="Seleccionar valor"
                            searchPlaceholder="Buscar valor..."
                            disabled={isPending || !selectedAttr2 || selectedAttr2 === 'none'}
                          />
                        ) : (
                          <Input
                            id="value2-input"
                            value={formData.option2Value}
                            onChange={(e) => setFormData(prev => ({ ...prev, option2Value: e.target.value }))}
                            placeholder={selectedAttr2 && selectedAttr2 !== 'none' ? "Ingresar valor" : "Selecciona un atributo primero"}
                            disabled={isPending || (!selectedAttr2 || selectedAttr2 === 'none')}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Variant Details */}
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Nombre de Variante <span className="text-destructive">*</span>
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>El nombre de la variante se genera automáticamente basado en los valores seleccionados (ej: "Rojo - M"). Puedes editarlo manualmente si lo deseas.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Auto-generado: Rojo - M"
                        required
                        disabled={isPending}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="sku" className="text-sm font-medium">SKU</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>Código único de identificación de la variante. Si lo dejas vacío, se generará automáticamente basado en el SKU del producto y los atributos seleccionados.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                        placeholder="Auto-generado si vacío"
                        disabled={isPending}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing and Stock */}
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="priceAdjustment" className="text-sm font-medium">
                          Ajuste de Precio
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>Diferencia de precio respecto al precio base del producto. Puede ser positivo (más caro) o negativo (más barato). El precio final se muestra debajo.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="priceAdjustment"
                        type="text"
                        value={priceAdjustmentInput}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          setPriceAdjustmentInput(inputValue);
                          const parsed = parsePriceAdjustment(inputValue);
                          setFormData(prev => ({ ...prev, priceAdjustment: parsed }));
                        }}
                        onBlur={(e) => {
                          const parsed = parsePriceAdjustment(e.target.value);
                          if (parsed !== null) {
                            setPriceAdjustmentInput(formatCurrency(parsed));
                          } else {
                            setPriceAdjustmentInput('');
                          }
                        }}
                        placeholder="Ej: $10.000 o -$5.000"
                        disabled={isPending}
                        className="h-10"
                      />
                      {selectedProduct && (
                        <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                          <span>Precio Final:</span>
                          <Badge variant="outline" className="font-medium">
                            {formatCurrency(selectedProduct.price + (formData.priceAdjustment ?? 0))}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="stockQuantity" className="text-sm font-medium">
                          Stock Inicial
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>Cantidad inicial de unidades disponibles de esta variante específica. Este stock es independiente del stock del producto base.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="stockQuantity"
                        type="number"
                        min="0"
                        step="1"
                        value={stockQuantityInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setStockQuantityInput(value);
                          const numValue = parseInt(value);
                          setFormData(prev => ({ ...prev, stockQuantity: isNaN(numValue) ? 0 : numValue }));
                        }}
                        placeholder="0"
                        disabled={isPending}
                        className="h-10"
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="minStock" className="text-sm font-medium">
                        Stock Mínimo
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>Nivel mínimo de stock recomendado. Cuando el stock disponible baje de este valor, se activará una alerta automática para notificarte que necesitas reponer inventario.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      step="1"
                      value={minStockInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMinStockInput(value);
                        const numValue = parseInt(value);
                        setFormData(prev => ({ ...prev, minStock: isNaN(numValue) ? 0 : numValue }));
                      }}
                      placeholder="0"
                      disabled={isPending}
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Se activará una alerta cuando el stock esté por debajo de este valor
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DrawerFooter className="border-t flex-shrink-0 bg-background">
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
    </TooltipProvider>
  );
}

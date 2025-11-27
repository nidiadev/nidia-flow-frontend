'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Package, Plus, Trash2, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { TenantLink } from '@/components/ui/tenant-link';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { productsApi, categoriesApi, ProductType, UpdateProductDto, CreateComboItemDto } from '@/lib/api/products';
import { Combobox } from '@/components/ui/combobox';
import { QueryLoading } from '@/components/ui/loading';

interface ComboItemForm {
  productId: string;
  quantity: number;
  productName?: string;
  productPrice?: number;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  const productId = params.id as string;

  // Fetch product
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['products', productId],
    queryFn: async () => {
      const response = await productsApi.getById(productId);
      return response;
    },
    enabled: !!productId,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const response = await categoriesApi.getAll({ limit: 100 });
      return response;
    },
  });

  // Fetch products for combo selection
  const { data: productsData } = useQuery({
    queryKey: ['products', 'for-combo'],
    queryFn: async () => {
      const response = await productsApi.getAll({ limit: 100, type: ProductType.PRODUCT });
      return response;
    },
    enabled: false, // Only fetch when needed
  });

  const product = productData?.data;
  const categories = categoriesData?.data?.data || [];
  const availableProducts = productsData?.data?.data || [];

  // Initialize form state from product
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    type: 'product' as ProductType,
    categoryId: '',
    brand: '',
    tags: [] as string[],
    price: '',
    cost: '',
    taxRate: '19',
    discountPercentage: '0',
    trackInventory: true,
    stockQuantity: '',
    stockMin: '',
    stockUnit: 'unidad',
    durationMinutes: '',
    requiresScheduling: false,
    isActive: true,
    isFeatured: false,
    imageUrl: '',
    barcode: '',
  });

  const [comboItems, setComboItems] = useState<ComboItemForm[]>([]);
  const [newComboItem, setNewComboItem] = useState({ productId: '', quantity: '1' });
  const [tagInput, setTagInput] = useState('');

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        description: product.description || '',
        type: product.type,
        categoryId: product.categoryId || '',
        brand: product.brand || '',
        tags: product.tags || [],
        price: product.price?.toString() || '',
        cost: product.cost?.toString() || '',
        taxRate: product.taxRate?.toString() || '19',
        discountPercentage: product.discountPercentage?.toString() || '0',
        trackInventory: product.trackInventory || false,
        stockQuantity: product.stockQuantity?.toString() || '',
        stockMin: product.stockMin?.toString() || '',
        stockUnit: product.stockUnit || 'unidad',
        durationMinutes: product.durationMinutes?.toString() || '',
        requiresScheduling: product.requiresScheduling || false,
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured || false,
        imageUrl: product.imageUrl || '',
        barcode: product.barcode || '',
      });

      // Populate combo items
      if (product.type === 'combo' && product.comboItems) {
        setComboItems(product.comboItems.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          productName: item.product?.name,
          productPrice: item.product?.price,
        })));
      }
    }
  }, [product]);

  // Update mutation
  const updateProduct = useMutation({
    mutationFn: async (data: UpdateProductDto) => {
      const response = await productsApi.update(productId, data);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      toast.success('Producto actualizado exitosamente');
      router.push(route(`/products/catalog/${productId}`));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar el producto');
    },
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleAddComboItem = () => {
    if (!newComboItem.productId) {
      toast.error('Debes seleccionar un producto');
      return;
    }

    const product = availableProducts.find((p: any) => p.id === newComboItem.productId);
    if (!product) {
      toast.error('Producto no encontrado');
      return;
    }

    if (comboItems.some(item => item.productId === newComboItem.productId)) {
      toast.error('Este producto ya está en el combo');
      return;
    }

    const quantity = parseFloat(newComboItem.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    setComboItems(prev => [...prev, {
      productId: newComboItem.productId,
      quantity,
      productName: product.name,
      productPrice: product.price,
    }]);
    setNewComboItem({ productId: '', quantity: '1' });
  };

  const handleRemoveComboItem = (productId: string) => {
    setComboItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleUpdateComboQuantity = (productId: string, quantity: string) => {
    const numQuantity = parseFloat(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      return;
    }
    setComboItems(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, quantity: numQuantity }
        : item
    ));
  };

  // Calculate combo total price
  const comboCalculations = useMemo(() => {
    const totalPrice = comboItems.reduce((sum, item) => {
      return sum + ((item.productPrice || 0) * item.quantity);
    }, 0);
    
    const currentPrice = formData.price ? parseFloat(formData.price) : 0;
    const discountAmount = totalPrice > 0 ? totalPrice - currentPrice : 0;
    const discountPercentage = totalPrice > 0 ? ((discountAmount / totalPrice) * 100) : 0;
    const savings = discountAmount > 0 ? discountAmount : 0;
    
    return {
      totalPrice,
      currentPrice,
      discountAmount,
      discountPercentage,
      savings,
    };
  }, [comboItems, formData.price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sku.trim()) {
      toast.error('El SKU es requerido');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    if (formData.type === 'combo') {
      if (comboItems.length === 0) {
        toast.error('Un combo debe tener al menos un producto');
        return;
      }
      if (comboItems.length < 2) {
        toast.error('Un combo debe tener al menos 2 productos');
        return;
      }
      if (comboCalculations.currentPrice >= comboCalculations.totalPrice) {
        toast.error('El precio del combo debe ser menor al precio total individual para ofrecer un descuento');
        return;
      }
    }

    if (formData.trackInventory && formData.type === 'product') {
      if (!formData.stockQuantity || parseFloat(formData.stockQuantity) < 0) {
        toast.error('El stock inicial es requerido');
        return;
      }
      if (!formData.stockMin || parseFloat(formData.stockMin) < 0) {
        toast.error('El stock mínimo es requerido');
        return;
      }
    }

    try {
      const payload: UpdateProductDto = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        brand: formData.brand.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : undefined,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        imageUrl: formData.imageUrl.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
      };

      // Add inventory fields for products
      if (formData.type === 'product') {
        payload.trackInventory = formData.trackInventory;
        if (formData.trackInventory) {
          payload.stockQuantity = parseFloat(formData.stockQuantity);
          payload.stockMin = parseFloat(formData.stockMin);
          payload.stockUnit = formData.stockUnit;
        }
      }

      // Add service fields
      if (formData.type === 'service') {
        if (formData.durationMinutes) {
          payload.durationMinutes = parseFloat(formData.durationMinutes);
        }
        payload.requiresScheduling = formData.requiresScheduling;
      }

      // Add combo items
      if (formData.type === 'combo' && comboItems.length > 0) {
        payload.comboItems = comboItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        }));
      }

      await updateProduct.mutateAsync(payload);
    } catch (error) {
      // Error is handled by mutation
    }
  };

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
      <div>
        <SectionHeader
          title={`Editar: ${product.name}`}
          description="Actualiza la información del producto"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <TenantLink href={route(`/products/catalog/${productId}`)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </TenantLink>
              </Button>
              <Button 
                size="sm"
                onClick={handleSubmit}
                disabled={updateProduct.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProduct.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          }
        />

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Main Information - Same as new page */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Datos principales del producto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        placeholder="PRD-001"
                        value={formData.sku}
                        onChange={(e) => handleChange('sku', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo *</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value) => handleChange('type', value as ProductType)}
                        disabled
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Producto</SelectItem>
                          <SelectItem value="service">Servicio</SelectItem>
                          <SelectItem value="combo">Combo</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">El tipo no se puede cambiar después de crear</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      placeholder="Nombre del producto"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      placeholder="Descripción detallada del producto"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Combobox
                        options={categories.map((cat: any) => ({
                          value: cat.id,
                          label: cat.name,
                        }))}
                        value={formData.categoryId}
                        onValueChange={(value) => handleChange('categoryId', value)}
                        placeholder="Seleccionar categoría..."
                        searchPlaceholder="Buscar categoría..."
                        emptyText="No se encontraron categorías"
                        allowCustom={false}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="barcode">Código de Barras</Label>
                      <Input
                        id="barcode"
                        placeholder="Código de barras"
                        value={formData.barcode}
                        onChange={(e) => handleChange('barcode', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      placeholder="Marca del producto"
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Etiquetas</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        placeholder="Agregar etiqueta..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pricing - Same as new page */}
              <Card>
                <CardHeader>
                  <CardTitle>Precios y Costos</CardTitle>
                  <CardDescription>
                    Información financiera del producto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Precio de Venta *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cost">Costo</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.cost}
                        onChange={(e) => handleChange('cost', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxRate">IVA (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="19"
                        value={formData.taxRate}
                        onChange={(e) => handleChange('taxRate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountPercentage">Descuento (%)</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={formData.discountPercentage}
                      onChange={(e) => handleChange('discountPercentage', e.target.value)}
                    />
                  </div>

                  {formData.price && formData.cost && parseFloat(formData.cost) > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Margen de Ganancia</div>
                      <div className="text-2xl font-bold">
                        {(((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Combo Items - Same as new page */}
              {formData.type === 'combo' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Productos del Combo</CardTitle>
                    <CardDescription>
                      Agrega los productos que forman parte de este combo. El precio se calculará automáticamente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Combobox
                          options={availableProducts
                            .filter((p: any) => !comboItems.some(item => item.productId === p.id))
                            .map((product: any) => ({
                              value: product.id,
                              label: `${product.name} - $${product.price.toFixed(2)}`,
                            }))}
                          value={newComboItem.productId}
                          onValueChange={(value) => setNewComboItem(prev => ({ ...prev, productId: value }))}
                          placeholder="Seleccionar producto..."
                          searchPlaceholder="Buscar producto..."
                          emptyText="No se encontraron productos"
                          allowCustom={false}
                        />
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Cantidad"
                        value={newComboItem.quantity}
                        onChange={(e) => setNewComboItem(prev => ({ ...prev, quantity: e.target.value }))}
                        className="w-32"
                      />
                      <Button type="button" onClick={handleAddComboItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>

                    {comboItems.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Productos agregados ({comboItems.length}):</div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {comboItems.map((item) => {
                            const product = availableProducts.find((p: any) => p.id === item.productId);
                            const itemTotal = (product?.price || 0) * item.quantity;
                            return (
                              <div key={item.productId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{item.productName || product?.name}</div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span>${(product?.price || 0).toFixed(2)} c/u</span>
                                    <span>×</span>
                                    <span>{item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right min-w-[100px]">
                                    <div className="font-semibold text-foreground">
                                      ${itemTotal.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Subtotal
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      value={item.quantity}
                                      onChange={(e) => handleUpdateComboQuantity(item.productId, e.target.value)}
                                      className="w-20 h-9"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveComboItem(item.productId)}
                                      className="h-9 w-9 p-0"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Combo Summary */}
                        <div className="pt-3 border-t space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Precio Total Individual</div>
                              <div className="text-xl font-semibold text-foreground">
                                ${comboCalculations.totalPrice.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Suma de todos los productos
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Precio del Combo</div>
                              <div className="text-xl font-semibold text-nidia-green">
                                ${comboCalculations.currentPrice > 0 ? comboCalculations.currentPrice.toFixed(2) : '0.00'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Precio de venta del combo
                              </div>
                            </div>
                          </div>
                          
                          {comboCalculations.totalPrice > 0 && (
                            <div className="p-3 bg-muted rounded-lg space-y-2">
                              {comboCalculations.currentPrice > 0 ? (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Ahorro para el cliente:</span>
                                    <span className="text-lg font-bold text-green-600">
                                      ${comboCalculations.savings.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Descuento aplicado:</span>
                                    <span className="text-sm font-semibold text-green-600">
                                      {comboCalculations.discountPercentage.toFixed(1)}%
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  <p className="mb-2">💡 <strong>Sugerencia:</strong> Establece un precio de venta menor al total para ofrecer un descuento atractivo.</p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const suggestedPrice = comboCalculations.totalPrice * 0.9;
                                      handleChange('price', suggestedPrice.toFixed(2));
                                    }}
                                    className="w-full"
                                  >
                                    Aplicar 10% de descuento (${(comboCalculations.totalPrice * 0.9).toFixed(2)})
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {comboItems.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay productos en el combo</p>
                        <p className="text-xs mt-1">Agrega productos para crear el combo</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Inventory - Same as new page */}
              {formData.type === 'product' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Inventario</CardTitle>
                    <CardDescription>
                      Control de stock y alertas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Controlar Inventario</Label>
                        <p className="text-sm text-muted-foreground">
                          Activar seguimiento de stock
                        </p>
                      </div>
                      <Switch
                        checked={formData.trackInventory}
                        onCheckedChange={(checked: boolean) => handleChange('trackInventory', checked)}
                      />
                    </div>

                    {formData.trackInventory && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stockQuantity">Stock Inicial *</Label>
                          <Input
                            id="stockQuantity"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.stockQuantity}
                            onChange={(e) => handleChange('stockQuantity', e.target.value)}
                            required={formData.trackInventory}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="stockMin">Stock Mínimo *</Label>
                          <Input
                            id="stockMin"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.stockMin}
                            onChange={(e) => handleChange('stockMin', e.target.value)}
                            required={formData.trackInventory}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="stockUnit">Unidad</Label>
                          <Select 
                            value={formData.stockUnit} 
                            onValueChange={(value) => handleChange('stockUnit', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unidad">Unidad</SelectItem>
                              <SelectItem value="caja">Caja</SelectItem>
                              <SelectItem value="paquete">Paquete</SelectItem>
                              <SelectItem value="kg">Kilogramo</SelectItem>
                              <SelectItem value="litro">Litro</SelectItem>
                              <SelectItem value="metro">Metro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Service Settings - Same as new page */}
              {formData.type === 'service' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración del Servicio</CardTitle>
                    <CardDescription>
                      Opciones específicas para servicios
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="durationMinutes">Duración (minutos)</Label>
                        <Input
                          id="durationMinutes"
                          type="number"
                          min="1"
                          placeholder="60"
                          value={formData.durationMinutes}
                          onChange={(e) => handleChange('durationMinutes', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Requiere Programación</Label>
                        <p className="text-sm text-muted-foreground">
                          El servicio necesita ser agendado
                        </p>
                      </div>
                      <Switch
                        checked={formData.requiresScheduling}
                        onCheckedChange={(checked: boolean) => handleChange('requiresScheduling', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Same as new page */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Producto Activo</Label>
                      <p className="text-sm text-muted-foreground">
                        Visible en el catálogo
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked: boolean) => handleChange('isActive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Destacado</Label>
                      <p className="text-sm text-muted-foreground">
                        Mostrar en inicio
                      </p>
                    </div>
                    <Switch
                      checked={formData.isFeatured}
                      onCheckedChange={(checked: boolean) => handleChange('isFeatured', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Imagen</CardTitle>
                  <CardDescription>
                    Imagen principal del producto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">URL de la Imagen</Label>
                    <Input
                      id="imageUrl"
                      placeholder="https://..."
                      value={formData.imageUrl}
                      onChange={(e) => handleChange('imageUrl', e.target.value)}
                    />
                    {formData.imageUrl && (
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg mt-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}


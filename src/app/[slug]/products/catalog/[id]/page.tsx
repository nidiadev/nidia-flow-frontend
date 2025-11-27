'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Layers,
  Tag,
  Image as ImageIcon,
  Copy,
  Trash2,
  MoreHorizontal,
  Grid3x3,
  ShoppingCart,
  FileText,
  Activity,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { TenantLink } from '@/components/ui/tenant-link';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { productsApi, variantsApi, Product, ProductType, PRODUCT_TYPE_CONFIG } from '@/lib/api/products';
import { QueryLoading } from '@/components/ui/loading';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PRODUCT_TYPE_CONFIG_UI: Record<ProductType, { label: string; variant: 'default' | 'secondary' | 'outline'; color: string }> = {
  product: { label: 'Producto', variant: 'default', color: 'text-blue-600' },
  service: { label: 'Servicio', variant: 'secondary', color: 'text-purple-600' },
  combo: { label: 'Combo', variant: 'outline', color: 'text-green-600' },
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  const productId = params.id as string;

  // Fetch product
  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['products', productId],
    queryFn: async () => {
      const response = await productsApi.getById(productId);
      return response;
    },
    enabled: !!productId,
  });

  // Fetch variants
  const { data: variantsData } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const response = await variantsApi.getByProduct(productId);
      return response;
    },
    enabled: !!productId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await productsApi.delete(productId);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      toast.success('Producto eliminado exitosamente');
      router.push(route('/products/catalog'));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar el producto');
    },
  });

  const product = productData?.data;
  const variants = variantsData?.data?.data || [];

  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <SectionHeader title="Cargando..." />
          <QueryLoading isLoading={true} />
        </div>
      </ErrorBoundary>
    );
  }

  if (error || !product) {
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

  const typeConfig = PRODUCT_TYPE_CONFIG_UI[product.type];
  const margin = product.cost ? ((product.price - product.cost) / product.price * 100).toFixed(1) : '0';
  const stockStatus = product.trackInventory 
    ? (product.stockQuantity || 0) === 0 
      ? { label: 'Sin Stock', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' }
      : (product.stockQuantity || 0) <= (product.stockMin || 0)
      ? { label: 'Stock Bajo', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' }
      : { label: 'En Stock', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' }
    : null;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title={product.name}
          description={product.description || `SKU: ${product.sku}`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <TenantLink href={route('/products/catalog')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </TenantLink>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <TenantLink href={route(`/products/catalog/${productId}/edit`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </TenantLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  {product.type === 'product' && (
                    <DropdownMenuItem asChild>
                      <TenantLink href={route(`/products/catalog/${productId}/variants`)}>
                        <Grid3x3 className="h-4 w-4 mr-2" />
                        Gestionar Variantes
                      </TenantLink>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
                        deleteMutation.mutate();
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" asChild>
                <TenantLink href={route(`/products/catalog/${productId}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </TenantLink>
              </Button>
            </div>
          }
        />

        {/* Main Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${product.price.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              {product.cost && product.cost > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Margen: {margin}% • Costo: ${product.cost.toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>

          {product.trackInventory && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stockStatus?.color}`}>
                  {product.stockQuantity || 0} {product.stockUnit || 'unidad'}
                </div>
                {product.stockMin !== undefined && product.stockMin > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Mínimo: {product.stockMin}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipo</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={typeConfig.variant} className={typeConfig.color}>
                {typeConfig.label}
              </Badge>
              {product.type === 'product' && variants.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {variants.length} variante{variants.length !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Detalles
            </TabsTrigger>
            {product.type === 'product' && (
              <TabsTrigger value="variants">
                <Grid3x3 className="h-4 w-4 mr-2" />
                Variantes ({variants.length})
              </TabsTrigger>
            )}
            {product.type === 'combo' && product.comboItems && product.comboItems.length > 0 && (
              <TabsTrigger value="combo">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Productos del Combo ({product.comboItems.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Actividad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">SKU</div>
                      <div className="font-semibold">{product.sku}</div>
                    </div>
                    {product.barcode && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Código de Barras</div>
                        <div className="font-semibold">{product.barcode}</div>
                      </div>
                    )}
                    {product.category && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Categoría</div>
                        <div className="font-semibold flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          {product.category.name}
                        </div>
                      </div>
                    )}
                    {product.brand && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Marca</div>
                        <div className="font-semibold">{product.brand}</div>
                      </div>
                    )}
                    {product.description && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Descripción</div>
                        <div className="text-sm">{product.description}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {product.tags && product.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Etiquetas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Precios y Costos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Precio de Venta</div>
                        <div className="text-xl font-bold">${product.price.toFixed(2)}</div>
                      </div>
                      {product.cost && product.cost > 0 && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Costo</div>
                          <div className="text-xl font-bold">${product.cost.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                    {product.cost && product.cost > 0 && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Margen de Ganancia</div>
                        <div className="text-2xl font-bold text-nidia-green">{margin}%</div>
                      </div>
                    )}
                    {product.taxRate !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">IVA</div>
                        <div className="font-semibold">{product.taxRate}%</div>
                      </div>
                    )}
                    {product.discountPercentage !== undefined && product.discountPercentage > 0 && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Descuento</div>
                        <div className="font-semibold text-green-600">{product.discountPercentage}%</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {product.trackInventory && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Inventario</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Stock Actual</div>
                          <div className={`text-xl font-bold ${stockStatus?.color}`}>
                            {product.stockQuantity || 0}
                          </div>
                        </div>
                        {product.stockMin !== undefined && (
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Stock Mínimo</div>
                            <div className="text-xl font-bold">{product.stockMin}</div>
                          </div>
                        )}
                      </div>
                      {stockStatus && (
                        <div className={`p-3 rounded-lg ${stockStatus.bg}`}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${stockStatus.color}`} />
                            <span className={`text-sm font-medium ${stockStatus.color}`}>
                              {stockStatus.label}
                            </span>
                          </div>
                        </div>
                      )}
                      {product.stockUnit && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Unidad</div>
                          <div className="font-semibold">{product.stockUnit}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {product.type === 'service' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuración del Servicio</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {product.durationMinutes && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Duración</div>
                          <div className="font-semibold">{product.durationMinutes} minutos</div>
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Requiere Programación</div>
                        <Badge variant={product.requiresScheduling ? 'default' : 'secondary'}>
                          {product.requiresScheduling ? 'Sí' : 'No'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {product.type === 'product' && (
            <TabsContent value="variants" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Variantes del Producto</CardTitle>
                    <CardDescription>
                      Gestiona las diferentes variantes (tallas, colores, etc.)
                    </CardDescription>
                  </div>
                  <Button asChild size="sm">
                    <TenantLink href={route(`/products/catalog/${productId}/variants`)}>
                      <Grid3x3 className="h-4 w-4 mr-2" />
                      Gestionar Variantes
                    </TenantLink>
                  </Button>
                </CardHeader>
                <CardContent>
                  {variants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Grid3x3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay variantes creadas</p>
                      <Button asChild className="mt-4" size="sm">
                        <TenantLink href={route(`/products/catalog/${productId}/variants`)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Variantes
                        </TenantLink>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {variants.slice(0, 5).map((variant) => {
                        const finalPrice = product.price + (variant.priceAdjustment || 0);
                        return (
                          <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{variant.name}</div>
                              {variant.sku && (
                                <div className="text-sm text-muted-foreground">SKU: {variant.sku}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-semibold">${finalPrice.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                  Stock: {variant.stockQuantity || 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {variants.length > 5 && (
                        <Button asChild variant="outline" className="w-full mt-2">
                          <TenantLink href={route(`/products/catalog/${productId}/variants`)}>
                            Ver todas las variantes ({variants.length})
                          </TenantLink>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {product.type === 'combo' && product.comboItems && product.comboItems.length > 0 && (
            <TabsContent value="combo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Productos del Combo</CardTitle>
                  <CardDescription>
                    Productos incluidos en este combo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {product.comboItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {item.product?.name || `Producto ${index + 1}`}
                          </div>
                          {item.product?.sku && (
                            <div className="text-sm text-muted-foreground">
                              SKU: {item.product.sku}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold">
                              {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}
                            </div>
                            {item.product?.price && (
                              <div className="text-xs text-muted-foreground">
                                ${item.product.price.toFixed(2)} c/u
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información del Producto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Fecha de Creación</div>
                    <div className="font-semibold">
                      {format(new Date(product.createdAt), "PP 'a las' p", { locale: es })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Última Actualización</div>
                    <div className="font-semibold">
                      {format(new Date(product.updatedAt), "PP 'a las' p", { locale: es })}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Estado</div>
                    <Badge variant={product.isActive ? 'default' : 'secondary'}>
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Destacado</div>
                    <Badge variant={product.isFeatured ? 'default' : 'secondary'}>
                      {product.isFeatured ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}


'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { VariantFormDrawer } from '@/components/products/variant-form-drawer';
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
  const { data: productsData, isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['products', 'for-variants-filter'],
    queryFn: async () => {
      try {
        // First request to get total count - include all products (active and inactive)
        const firstPage = await productsApi.getAll({ page: 1, limit: 100 });
        console.log('First page response:', firstPage);
        
        // The API returns { data: { data: [...], pagination: {...} } } or { data: [...], pagination: {...} }
        // Let's check both structures
        const responseData = firstPage?.data;
        const products = responseData?.data || responseData || [];
        const total = responseData?.pagination?.total || products.length;
        
        console.log('First page products:', products);
        console.log('Total products:', total);
        
        if (total <= 100) {
          return firstPage;
        }
        
        // If more than 100, fetch remaining pages
        const totalPages = Math.ceil(total / 100);
        const allProducts = Array.isArray(products) ? [...products] : [];
        
        for (let page = 2; page <= totalPages; page++) {
          const pageData = await productsApi.getAll({ page, limit: 100 });
          const pageResponseData = pageData?.data;
          const pageProducts = pageResponseData?.data || pageResponseData || [];
          if (Array.isArray(pageProducts)) {
            allProducts.push(...pageProducts);
          }
        }
        
        return { data: allProducts, pagination: { total } };
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle both response structures: { data: { data: [...] } } or { data: [...] }
  const products = useMemo(() => {
    if (!productsData) return [];
    const responseData = productsData?.data;
    if (Array.isArray(responseData)) {
      return responseData;
    }
    if (responseData?.data && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    return [];
  }, [productsData]);
  
  // Debug: Log products to see what we're getting
  useEffect(() => {
    if (productsData) {
      console.log('Products data raw:', productsData);
      console.log('Products array:', products);
      console.log('Products count:', products.length);
      if (products.length > 0) {
        console.log('First product:', products[0]);
      }
    }
  }, [productsData, products]);
  
  // Show error if products fail to load
  useEffect(() => {
    if (productsError) {
      toast.error('Error al cargar los productos. Por favor, intenta de nuevo.');
    }
  }, [productsError]);

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
          // El backend devuelve: { success: true, data: [...] }
          // ApiClient.get devuelve response.data, entonces response = { success: true, data: [...] }
          const variants = response?.data || [];
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
            <>
              {isLoadingProducts && (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Cargando productos...
                </span>
              )}
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading || isLoadingProducts}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
            </Button>
            </>
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
              disabled: false, // Always allow opening drawer, it will show message if no products
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
            title: products.length === 0 ? 'No hay productos disponibles' : 'No hay variantes',
            description: products.length === 0 
              ? 'Primero debes crear productos en el catálogo para poder agregar variantes'
              : 'Las variantes de productos aparecerán aquí cuando crees productos con opciones (tallas, colores, etc.)',
            action: products.length === 0 ? (
              <Button onClick={() => router.push(route('/products/catalog'))}>
                <Package className="h-4 w-4 mr-2" />
                Ir al Catálogo
              </Button>
            ) : (
              <Button onClick={() => setCreateDialogOpen(true)} disabled={isLoadingProducts}>
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

        {/* Variant Form Drawer (Create/Edit) */}
        <VariantFormDrawer
          open={createDialogOpen || editDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setCreateDialogOpen(false);
              setEditDialogOpen(false);
              setSelectedVariant(null);
            }
          }}
          products={products}
          variant={selectedVariant}
          onSuccess={() => {
            setSelectedVariant(null);
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

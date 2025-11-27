'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2,
  Package,
  Eye,
  Copy,
  AlertTriangle,
  TrendingUp,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { TenantLink } from '@/components/ui/tenant-link';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { productsApi, Product, ProductType } from '@/lib/api/products';
import { ProductCard } from '@/components/products/product-card';
import { Table } from '@/components/table';
import { TableRowAction } from '@/components/table/types';

// Product Type Config
const PRODUCT_TYPE_CONFIG: Record<ProductType, { label: string; variant: 'default' | 'secondary' | 'outline'; color: string }> = {
  product: { label: 'Producto', variant: 'default', color: 'text-blue-600' },
  service: { label: 'Servicio', variant: 'secondary', color: 'text-purple-600' },
  combo: { label: 'Combo', variant: 'outline', color: 'text-green-600' },
};

// Stock Status Helper
function getStockStatus(currentStock: number, minStock: number) {
  if (currentStock === 0) {
    return { label: 'Sin Stock', variant: 'destructive' as const, color: 'text-red-600' };
  }
  if (currentStock <= minStock) {
    return { label: 'Stock Bajo', variant: 'warning' as const, color: 'text-orange-600' };
  }
  return { label: 'En Stock', variant: 'success' as const, color: 'text-green-600' };
}

// Define columns for DataTable
function getColumns(): ColumnDef<Product>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Producto',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center space-x-3 group">
            <div className="flex-shrink-0">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-10 h-10 rounded-lg object-cover border"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-nidia-green/20 to-nidia-purple/20 rounded-lg flex items-center justify-center border">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-foreground group-hover:text-nidia-green transition-colors truncate">
                {product.name}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                SKU: {product.sku}
                {product.category && ` • ${product.category.name}`}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const typeConfig = PRODUCT_TYPE_CONFIG[row.original.type];
        return (
          <Badge 
            variant={typeConfig.variant}
            className={`${typeConfig.color} text-xs font-medium px-2.5 py-0.5`}
          >
            {typeConfig.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'Precio',
      cell: ({ row }) => {
        const product = row.original;
        const margin = product.cost ? ((product.price - product.cost) / product.price * 100).toFixed(1) : '0';
        return (
          <div>
            <div className="font-semibold text-foreground">
              ${product.price.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {product.cost && product.cost > 0 && (
              <div className="text-xs text-muted-foreground">
                Margen: {margin}%
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
        const product = row.original;
        if (!product.trackInventory) {
          return <span className="text-sm text-muted-foreground">N/A</span>;
        }
        const stockStatus = getStockStatus(
          product.stockQuantity || 0,
          product.stockMin || 0
        );
        return (
          <div>
            <div className={`font-semibold ${stockStatus.color}`}>
              {product.stockQuantity || 0} {product.stockUnit || 'unidad'}
            </div>
            {product.stockMin !== undefined && product.stockMin > 0 && (
              <div className="text-xs text-muted-foreground">
                Mín: {product.stockMin}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'stockStatus',
      header: 'Estado',
      cell: ({ row }) => {
        const product = row.original;
        if (!product.trackInventory) return null;
        const stockStatus = getStockStatus(
          product.stockQuantity || 0,
          product.stockMin || 0
        );
        return (
          <Badge variant={stockStatus.variant} className="text-xs font-medium px-2.5 py-0.5">
            {stockStatus.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Activo',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs font-medium px-2.5 py-0.5">
            {isActive ? 'Sí' : 'No'}
          </Badge>
        );
      },
    },
  ];
}

export default function ProductCatalogPage() {
  const { isOffline } = useNetworkStatus();
  const { route } = useTenantRoutes();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Build filters for API
  const apiFilters = useMemo(() => ({
    page,
    limit,
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
  }), [page, limit]);

  // Fetch products
  const { data: productsData, isLoading, error, refetch } = useQuery({
    queryKey: ['products', apiFilters],
    queryFn: async () => {
      const response = await productsApi.getAll(apiFilters);
      return response;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await productsApi.delete(id);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar el producto');
    },
  });

  const products = productsData?.data || [];
  const pagination = productsData?.pagination;
  const columns = useMemo(() => getColumns(), []);
  
  // Calculate stats
  const statsData = useMemo(() => {
    if (!products.length) return [];
    
    const total = pagination?.total || products.length;
    const lowStock = products.filter((p: Product) => 
      p.trackInventory && 
      (p.stockQuantity || 0) > 0 && 
      (p.stockQuantity || 0) <= (p.stockMin || 0)
    ).length;
    const outOfStock = products.filter((p: Product) => 
      p.trackInventory && 
      (p.stockQuantity || 0) === 0
    ).length;
    const totalValue = products.reduce((sum: number, p: Product) => 
      sum + (p.price * (p.stockQuantity || 0)), 0
    );

    return [
      {
        label: 'Total Productos',
        value: total,
        description: pagination?.total ? `de ${pagination.total} productos` : 'en catálogo',
        icon: <Package className="h-4 w-4 text-muted-foreground" />,
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
        description: 'Productos agotados',
        icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      },
      {
        label: 'Valor Total',
        value: `$${totalValue.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        description: 'En esta página',
        icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      },
    ];
  }, [products, pagination]);

  // Row actions
  const rowActions: TableRowAction<Product>[] = useMemo(() => [
    {
      label: 'Ver detalle',
      icon: <Eye className="h-4 w-4" />,
      onClick: (product) => {
        router.push(route(`/products/catalog/${product.id}`));
      },
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (product) => {
        router.push(route(`/products/catalog/${product.id}/edit`));
      },
    },
    {
      label: 'Duplicar',
      icon: <Copy className="h-4 w-4" />,
      onClick: () => {
        toast.info('Función de duplicar próximamente');
      },
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      separator: true,
      onClick: (product) => {
        if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
          deleteMutation.mutate(product.id);
        }
      },
    },
  ], [route, router, deleteMutation]);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        {/* Header */}
        <SectionHeader
          title="Catálogo de Productos"
          description="Gestiona tu inventario de productos y servicios"
          actions={
            isOffline ? (
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-3 py-1.5 rounded-md text-xs font-medium">
                <div className="w-1.5 h-1.5 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
                <span>Offline</span>
              </div>
            ) : null
          }
        />

        {/* Tabla con componente global */}
        <Table
          id="products-catalog"
          data={products}
          columns={columns}
          search={{
            enabled: true,
            placeholder: 'Buscar por nombre, SKU o descripción...',
          }}
          pagination={{
            enabled: true,
            pageSize: limit,
            serverSide: true,
            total: pagination?.total,
            onPageChange: (newPage) => setPage(newPage),
          }}
          rowActions={rowActions}
          actions={[
            {
              label: 'Exportar',
              icon: <Download className="h-4 w-4" />,
              variant: 'outline',
              onClick: () => toast.info('Función de exportar próximamente'),
            },
            {
              label: 'Nuevo Producto',
              icon: <Plus className="h-4 w-4" />,
              onClick: () => router.push(route('/products/catalog/new')),
            },
          ]}
          stats={{
            enabled: true,
            stats: statsData,
          }}
          cards={{
            enabled: true,
            gridCols: { default: 1, sm: 2, lg: 3, xl: 4 },
            renderCard: (product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewUrl={route(`/products/catalog/${product.id}`)}
                editUrl={route(`/products/catalog/${product.id}/edit`)}
                onDelete={(id) => {
                  if (confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) {
                    deleteMutation.mutate(id);
                  }
                }}
                onEdit={(id) => router.push(route(`/products/catalog/${id}/edit`))}
                onView={(id) => router.push(route(`/products/catalog/${id}`))}
              />
            ),
          }}
          emptyState={{
            icon: <Package className="h-16 w-16 text-muted-foreground/50" />,
            title: 'No hay productos aún',
            description: 'Comienza agregando tu primer producto al catálogo para gestionar tu inventario',
            action: (
              <Button asChild>
                <TenantLink href={route('/products/catalog/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </TenantLink>
              </Button>
            ),
          }}
          isLoading={isLoading}
          isError={!!error}
          error={error as Error | null}
          onRetry={refetch}
          features={{
            columnVisibility: true,
            columnSizing: true,
          }}
          getRowId={(row) => row.id}
        />
      </div>
    </ErrorBoundary>
  );
}

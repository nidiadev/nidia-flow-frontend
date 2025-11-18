'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Package,
  Eye,
  Copy,
  AlertTriangle,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageHeader } from '@/components/ui/page-header';
import { TenantLink } from '@/components/ui/tenant-link';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { toast } from 'sonner';
import { Product, PRODUCT_TYPE_CONFIG, getStockStatus } from '@/types/product';
import { DataTable, DataTableAction } from '@/components/ui/data-table';

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    sku: 'LAP-001',
    name: 'Laptop Dell XPS 15',
    description: 'Laptop de alto rendimiento',
    type: 'product',
    categoryId: '1',
    categoryName: 'Computadoras',
    price: 1299.99,
    cost: 899.99,
    taxRate: 19,
    currency: 'USD',
    trackInventory: true,
    currentStock: 2,
    minStock: 5,
    unit: 'unidad',
    isActive: true,
    isFeatured: true,
    imageUrl: '/products/laptop.jpg',
    tags: ['tecnología', 'portátil'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    sku: 'MOU-001',
    name: 'Mouse Logitech MX Master',
    description: 'Mouse ergonómico inalámbrico',
    type: 'product',
    categoryId: '2',
    categoryName: 'Accesorios',
    price: 99.99,
    cost: 59.99,
    taxRate: 19,
    currency: 'USD',
    trackInventory: true,
    currentStock: 0,
    minStock: 10,
    unit: 'unidad',
    isActive: true,
    isFeatured: false,
    tags: ['accesorios', 'periféricos'],
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '3',
    sku: 'SRV-001',
    name: 'Instalación de Software',
    description: 'Servicio de instalación y configuración',
    type: 'service',
    categoryId: '3',
    categoryName: 'Servicios',
    price: 50.00,
    cost: 0,
    taxRate: 19,
    currency: 'USD',
    trackInventory: false,
    currentStock: 0,
    minStock: 0,
    unit: 'hora',
    isActive: true,
    isFeatured: false,
    tags: ['servicio', 'soporte'],
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
  },
];

// Filters component
function ProductFilters({ 
  searchTerm, 
  setSearchTerm, 
  typeFilter, 
  setTypeFilter,
  stockFilter,
  setStockFilter,
  sortBy,
  setSortBy
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  stockFilter: string;
  setStockFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por nombre, SKU o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="product">Productos</SelectItem>
          <SelectItem value="service">Servicios</SelectItem>
          <SelectItem value="combo">Combos</SelectItem>
        </SelectContent>
      </Select>

      <Select value={stockFilter} onValueChange={setStockFilter}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Stock" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="in_stock">En stock</SelectItem>
          <SelectItem value="low_stock">Stock bajo</SelectItem>
          <SelectItem value="out_of_stock">Sin stock</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Nombre A-Z</SelectItem>
          <SelectItem value="name-desc">Nombre Z-A</SelectItem>
          <SelectItem value="price-asc">Precio menor</SelectItem>
          <SelectItem value="price-desc">Precio mayor</SelectItem>
          <SelectItem value="stock-asc">Stock menor</SelectItem>
          <SelectItem value="stock-desc">Stock mayor</SelectItem>
          <SelectItem value="createdAt-desc">Más recientes</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
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
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-10 h-10 rounded object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <div className="font-medium text-foreground">
                {product.name}
              </div>
              <div className="text-sm text-muted-foreground">
                SKU: {product.sku}
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
            className={typeConfig.color}
          >
            {typeConfig.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'categoryName',
      header: 'Categoría',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.categoryName || 'Sin categoría'}
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Precio',
      cell: ({ row }) => {
        const product = row.original;
        const margin = product.cost ? ((product.price - product.cost) / product.price * 100).toFixed(1) : '0';
        return (
          <div>
            <div className="font-medium">
              ${product.price.toFixed(2)}
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
      accessorKey: 'currentStock',
      header: 'Stock',
      cell: ({ row }) => {
        const product = row.original;
        const stockStatus = getStockStatus(product.currentStock, product.minStock);
        return product.trackInventory ? (
          <div>
            <div className={`font-medium ${stockStatus.color}`}>
              {product.currentStock} {product.unit}
            </div>
            <div className="text-xs text-muted-foreground">
              Mín: {product.minStock}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">N/A</span>
        );
      },
    },
    {
      accessorKey: 'stockStatus',
      header: 'Estado Stock',
      cell: ({ row }) => {
        const product = row.original;
        const stockStatus = getStockStatus(product.currentStock, product.minStock);
        return product.trackInventory ? (
          <Badge variant={stockStatus.variant}>
            {stockStatus.label}
          </Badge>
        ) : null;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge variant={isActive ? 'success' : 'secondary'}>
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
  ];
}

export default function ProductCatalogPage() {
  const { isOffline } = useNetworkStatus();
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  
  // Mock products
  const products = mockProducts;
  const columns = useMemo(() => getColumns(), []);
  
  // Actions for DataTable
  const actions: DataTableAction<Product>[] = [
    {
      label: 'Ver detalle',
      icon: <Eye className="h-4 w-4" />,
      onClick: (product) => {
        window.location.href = `/products/catalog/${product.id}`;
      },
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (product) => {
        window.location.href = `/products/catalog/${product.id}/edit`;
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
          toast.success(`Producto "${product.name}" eliminado`);
        }
      },
    },
  ];
  
  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === typeFilter);
    }
    
    // Stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (!p.trackInventory) return false;
        if (stockFilter === 'out_of_stock') return p.currentStock === 0;
        if (stockFilter === 'low_stock') return p.currentStock > 0 && p.currentStock <= p.minStock;
        if (stockFilter === 'in_stock') return p.currentStock > p.minStock;
        return true;
      });
    }
    
    // Sort
    const [field, order] = sortBy.split('-');
    filtered.sort((a, b) => {
      let aVal: any = a[field as keyof Product];
      let bVal: any = b[field as keyof Product];
      
      if (field === 'name') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [products, searchTerm, typeFilter, stockFilter, sortBy]);

  return (
    <ErrorBoundary>
      <div>
        <PageHeader
          title="Catálogo de Productos"
          description="Gestiona tu inventario de productos y servicios"
          variant="gradient"
          actions={
            <>
              {isOffline && (
                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Modo Offline</span>
                </div>
              )}
              
              <Button asChild>
                <TenantLink href="/products/catalog/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </TenantLink>
              </Button>
            </>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {products.filter(p => p.trackInventory && p.currentStock > 0 && p.currentStock <= p.minStock).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {products.filter(p => p.trackInventory && p.currentStock === 0).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${products.reduce((sum, p) => sum + (p.price * p.currentStock), 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <ProductFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          stockFilter={stockFilter}
          setStockFilter={setStockFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>
              Gestiona tu catálogo de productos y servicios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredProducts}
              columns={columns}
              searchPlaceholder="Buscar productos..."
              emptyMessage="No hay productos"
              emptyDescription={
                searchTerm || typeFilter !== 'all' || stockFilter !== 'all'
                  ? 'No se encontraron productos con los filtros aplicados'
                  : 'Comienza agregando tu primer producto'
              }
              actions={actions}
              enableColumnVisibility={true}
              enableColumnSizing={true}
              getRowId={(row) => row.id}
            />
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

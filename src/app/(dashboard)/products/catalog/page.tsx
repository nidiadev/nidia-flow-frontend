'use client';

import { useState, useMemo } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
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
import { useNetworkStatus } from '@/hooks/use-network-status';
import { toast } from 'sonner';
import { Product, PRODUCT_TYPE_CONFIG, getStockStatus } from '@/types/product';

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

// Product row component
function ProductRow({ product }: { product: Product }) {
  const typeConfig = PRODUCT_TYPE_CONFIG[product.type];
  const stockStatus = getStockStatus(product.currentStock, product.minStock);
  const margin = product.cost ? ((product.price - product.cost) / product.price * 100).toFixed(1) : '0';
  
  return (
    <TableRow>
      <TableCell>
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
      </TableCell>
      
      <TableCell>
        <Badge 
          variant={typeConfig.variant}
          className={typeConfig.color}
        >
          {typeConfig.label}
        </Badge>
      </TableCell>
      
      <TableCell>
        <div className="text-sm">
          {product.categoryName || 'Sin categoría'}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="font-medium">
          ${product.price.toFixed(2)}
        </div>
        {product.cost && product.cost > 0 && (
          <div className="text-xs text-muted-foreground">
            Margen: {margin}%
          </div>
        )}
      </TableCell>
      
      <TableCell>
        {product.trackInventory ? (
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
        )}
      </TableCell>
      
      <TableCell>
        {product.trackInventory && (
          <Badge variant={stockStatus.variant}>
            {stockStatus.label}
          </Badge>
        )}
      </TableCell>
      
      <TableCell>
        <Badge variant={product.isActive ? 'success' : 'secondary'}>
          {product.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      </TableCell>
      
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/products/catalog/${product.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/products/catalog/${product.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('Función de duplicar próximamente')}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">
              Catálogo de Productos
            </h1>
            <p className="text-muted-foreground">
              Gestiona tu inventario de productos y servicios
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isOffline && (
              <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Modo Offline</span>
              </div>
            )}
            
            <Button asChild>
              <Link href="/products/catalog/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Link>
            </Button>
          </div>
        </div>

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
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay productos</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || typeFilter !== 'all' || stockFilter !== 'all'
                    ? 'No se encontraron productos con los filtros aplicados'
                    : 'Comienza agregando tu primer producto'
                  }
                </p>
                <Button asChild>
                  <Link href="/products/catalog/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Estado Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <ProductRow key={product.id} product={product} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

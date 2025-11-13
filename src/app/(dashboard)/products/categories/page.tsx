'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Layers,
  Package
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { toast } from 'sonner';
import { Category } from '@/types/product';

// Mock data
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Computadoras',
    description: 'Laptops, desktops y tablets',
    isActive: true,
    sortOrder: 1,
    productsCount: 45,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Accesorios',
    description: 'Mouse, teclados, audífonos',
    isActive: true,
    sortOrder: 2,
    productsCount: 78,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: '3',
    name: 'Servicios',
    description: 'Instalación, soporte y mantenimiento',
    isActive: true,
    sortOrder: 3,
    productsCount: 12,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: '4',
    name: 'Software',
    description: 'Licencias y aplicaciones',
    isActive: false,
    sortOrder: 4,
    productsCount: 21,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
];

// Category row component
function CategoryRow({ category }: { category: Category }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{category.name}</div>
            {category.description && (
              <div className="text-sm text-muted-foreground">{category.description}</div>
            )}
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>{category.productsCount || 0}</span>
        </div>
      </TableCell>
      
      <TableCell>
        <Badge variant={category.isActive ? 'success' : 'secondary'}>
          {category.isActive ? 'Activa' : 'Inactiva'}
        </Badge>
      </TableCell>
      
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {new Date(category.createdAt).toLocaleDateString('es-ES')}
        </div>
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
            <DropdownMenuItem onClick={() => toast.info('Función de editar próximamente')}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
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

// New category dialog
function NewCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Categoría creada exitosamente');
    setOpen(false);
    setFormData({ name: '', description: '' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>
              Crea una nueva categoría para organizar tus productos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Nombre de la categoría"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción de la categoría"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear Categoría</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriesPage() {
  const { isOffline } = useNetworkStatus();
  const [searchTerm, setSearchTerm] = useState('');
  
  const categories = mockCategories;
  
  // Filter categories
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCategories = categories.filter(c => c.isActive).length;
  const totalProducts = categories.reduce((sum, c) => sum + (c.productsCount || 0), 0);

  return (
    <ErrorBoundary>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">
              Categorías
            </h1>
            <p className="text-muted-foreground">
              Organiza tu catálogo de productos
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isOffline && (
              <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Modo Offline</span>
              </div>
            )}
            
            <NewCategoryDialog />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeCategories} activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos Totales</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                En todas las categorías
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {categories.length > 0 ? Math.round(totalProducts / categories.length) : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Productos por categoría
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías</CardTitle>
            <CardDescription>
              {filteredCategories.length} categoría{filteredCategories.length !== 1 ? 's' : ''} encontrada{filteredCategories.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay categorías</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'No se encontraron categorías con ese criterio'
                    : 'Comienza creando tu primera categoría'
                  }
                </p>
                <NewCategoryDialog />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <CategoryRow key={category.id} category={category} />
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

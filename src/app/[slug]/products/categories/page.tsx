'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Plus, 
  Edit, 
  Trash2,
  Layers,
  Package
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageHeader } from '@/components/ui/page-header';
import { TenantLink } from '@/components/ui/tenant-link';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { toast } from 'sonner';
import { Category } from '@/types/product';
import { DataTable, DataTableAction } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';

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

// Define columns for DataTable
function getColumns(): ColumnDef<Category>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Categoría',
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{category.name}</div>
              {category.description && (
                <div className="text-sm text-muted-foreground">{category.description}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'productsCount',
      header: 'Productos',
      cell: ({ row }) => {
        const count = row.original.productsCount || 0;
        return (
          <div className="flex items-center space-x-1">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge variant={isActive ? 'success' : 'secondary'}>
            {isActive ? 'Activa' : 'Inactiva'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha Creación',
      cell: ({ row }) => {
        return (
          <div className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString('es-ES')}
          </div>
        );
      },
    },
  ];
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
  
  const categories = mockCategories;
  const columns = useMemo(() => getColumns(), []);
  
  // Actions for DataTable
  const actions: DataTableAction<Category>[] = [
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (category) => {
        toast.info(`Editar categoría: ${category.name}`);
      },
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      separator: true,
      onClick: (category) => {
        if (confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
          toast.success(`Categoría "${category.name}" eliminada`);
        }
      },
    },
  ];

  const activeCategories = categories.filter(c => c.isActive).length;
  const totalProducts = categories.reduce((sum, c) => sum + (c.productsCount || 0), 0);

  return (
    <ErrorBoundary>
      <div>
        <PageHeader
          title="Categorías"
          description="Organiza tu catálogo de productos"
          variant="gradient"
          actions={
            <>
              {isOffline && (
                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Modo Offline</span>
                </div>
              )}
              
              <NewCategoryDialog />
            </>
          }
        />

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

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías</CardTitle>
            <CardDescription>
              Gestiona las categorías de tu catálogo de productos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={categories}
              columns={columns}
              searchPlaceholder="Buscar categorías..."
              emptyMessage="No hay categorías"
              emptyDescription="Comienza creando tu primera categoría"
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

'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
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
  Plus, 
  Edit, 
  Trash2,
  Layers,
  Package
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { TenantLink } from '@/components/ui/tenant-link';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { categoriesApi, Category } from '@/lib/api/products';
import { Table, TableRowAction } from '@/components/table';
import { Combobox } from '@/components/ui/combobox';

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
              {category.path && category.path.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {category.path.join(' > ')}
                </div>
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
          <Badge variant={isActive ? 'default' : 'secondary'}>
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
function NewCategoryDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    isActive: true,
    sortOrder: 0,
  });

  // Fetch categories for parent selection
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const response = await categoriesApi.getAll({ limit: 100 });
      return response;
    },
  });

  const categories = categoriesData?.data || [];

  const createCategory = useMutation({
    mutationFn: async (data: any) => {
      const response = await categoriesApi.create(data);
      return response;
    },
    onSuccess: async (response) => {
      // Invalidar todas las queries de categorías para forzar refetch en tiempo real
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['category-stats'] });
      
      toast.success('Categoría creada exitosamente');
      onOpenChange(false);
      setFormData({ name: '', description: '', parentId: '', isActive: true, sortOrder: 0 });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear la categoría');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    
    try {
      await createCategory.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        parentId: formData.parentId || undefined,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
      });
    } catch (error) {
      // Error is handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

            <div className="space-y-2">
              <Label htmlFor="parentId">Categoría Padre (Opcional)</Label>
              <Combobox
                options={categories
                  .filter((c: Category) => c.id !== formData.parentId) // Prevent circular reference
                  .map((category: Category) => ({
                    value: category.id,
                    label: category.name,
                  }))}
                value={formData.parentId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value }))}
                placeholder="Seleccionar categoría padre..."
                searchPlaceholder="Buscar categoría..."
                emptyText="No se encontraron categorías"
                allowCustom={false}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Guardando...' : 'Crear Categoría'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriesPage() {
  const { isOffline } = useNetworkStatus();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Fetch categories
  const { data: categoriesData, isLoading, error, refetch } = useQuery({
    queryKey: ['categories', { page, limit }],
    queryFn: async () => {
      const response = await categoriesApi.getAll({ page, limit });
      return response;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['category-stats'],
    queryFn: async () => {
      const response = await categoriesApi.getStats();
      return response;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await categoriesApi.delete(id);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-stats'] });
      toast.success('Categoría eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar la categoría');
    },
  });

  const pagination = categoriesData?.pagination;
  const stats = statsData?.data;
  
  const categories = useMemo(() => {
    // El backend devuelve { success: true, data: Category[], pagination: {...} }
    // Entonces categoriesData.data es el array de categorías directamente
    const cats = categoriesData?.data || [];
    // Debug en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('Categories data:', { 
        categoriesData, 
        cats, 
        stats,
        pagination,
        totalCategories: cats.length,
        rawData: categoriesData 
      });
    }
    return cats;
  }, [categoriesData, stats, pagination]);
  const columns = useMemo(() => getColumns(), []);
  
  // Actions for Table
  const rowActions: TableRowAction<Category>[] = [
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (category) => {
        toast.info(`Editar categoría: ${category.name}`);
        // TODO: Navigate to edit page
      },
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      separator: true,
      onClick: (category) => {
        if (confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
          deleteMutation.mutate(category.id);
        }
      },
    },
  ];

  const activeCategories = stats?.activeCategories || categories.filter((c: Category) => c.isActive).length;
  const totalProducts = categories.reduce((sum: number, c: Category) => sum + (c.productsCount || 0), 0);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <SectionHeader
          title="Categorías"
          description="Organiza tu catálogo de productos"
          actions={
            <>
              {isOffline && (
                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Modo Offline</span>
                </div>
              )}
            </>
          }
        />

        {/* Table con estadísticas integradas */}
        <Table
          id="categories"
          data={categories}
          columns={columns}
          search={{
            enabled: true,
            placeholder: 'Buscar categorías...',
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
              label: 'Nueva Categoría',
              icon: <Plus className="h-4 w-4" />,
              onClick: () => setNewCategoryOpen(true),
            },
          ]}
          stats={{
            enabled: true,
            stats: [
              {
                label: 'Total Categorías',
                value: stats?.totalCategories || categories.length,
                description: `${activeCategories} activas`,
                icon: <Layers className="h-4 w-4 text-muted-foreground" />,
              },
              {
                label: 'Productos Totales',
                value: totalProducts,
                description: 'En todas las categorías',
                icon: <Package className="h-4 w-4 text-muted-foreground" />,
              },
              {
                label: 'Promedio',
                value: categories.length > 0 ? Math.round(totalProducts / categories.length) : 0,
                description: 'Productos por categoría',
                icon: <Package className="h-4 w-4 text-muted-foreground" />,
              },
            ],
          }}
          emptyState={{
            title: 'No hay categorías aún',
            description: 'Organiza tu catálogo creando categorías para agrupar tus productos de manera eficiente',
            action: (
              <Button onClick={() => setNewCategoryOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
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

        <NewCategoryDialog
          open={newCategoryOpen}
          onOpenChange={setNewCategoryOpen}
          onSuccess={() => {
            // Invalidar todas las queries de categorías (con y sin paginación)
            // React Query automáticamente refetch las queries activas
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['category-stats'] });
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

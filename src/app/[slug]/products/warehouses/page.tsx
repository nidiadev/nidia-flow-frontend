'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table } from '@/components/table';
import { warehousesApi, Warehouse } from '@/lib/api/products';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { WarehouseFormDrawer } from '@/components/products/warehouse-form-drawer';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { TableRowAction } from '@/components/table/types';

export default function WarehousesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const queryClient = useQueryClient();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | undefined>(undefined);

  const { data: warehousesData, isLoading, error, refetch } = useQuery({
    queryKey: ['warehouses', slug],
    queryFn: async () => {
      const response = await warehousesApi.getAll();
      return response;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => warehousesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Bodega eliminada');
    },
    onError: () => toast.error('Error al eliminar bodega'),
  });

  const handleCreate = () => {
    setSelectedWarehouse(undefined);
    setIsDrawerOpen(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsDrawerOpen(true);
  };

  const handleDelete = (warehouse: Warehouse) => {
    if (confirm(`¿Estás seguro de eliminar la bodega "${warehouse.name}"?`)) {
      deleteMutation.mutate(warehouse.id);
    }
  };

  const columns: ColumnDef<Warehouse>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
          <div className="flex flex-col">
              <span className="font-medium">{row.original.name}</span>
              {row.original.isDefault && <span className="text-xs text-primary">Predeterminada</span>}
          </div>
      )
    },
    {
      accessorKey: 'location',
      header: 'Ubicación',
      cell: ({ row }) => (
          row.original.location ? (
              <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="text-sm truncate max-w-[200px]">{row.original.location}</span>
              </div>
          ) : '-'
      )
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => (
          row.original.isActive ? <Badge variant="default">Activa</Badge> : <Badge variant="secondary">Inactiva</Badge>
      )
    },
  ], []);

  const rowActions: TableRowAction<Warehouse>[] = useMemo(() => [
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (warehouse) => handleEdit(warehouse),
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      separator: true,
      onClick: (warehouse) => handleDelete(warehouse),
    },
  ], []);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <SectionHeader
          title="Gestión de Bodegas"
          description="Administra las ubicaciones de almacenamiento de tu inventario"
        />

        <Table
          id="warehouses"
          data={warehousesData?.data || []}
          columns={columns}
          isLoading={isLoading}
          isError={!!error}
          error={error as Error | null}
          onRetry={refetch}
          rowActions={rowActions}
          actions={[
            {
              label: 'Nueva Bodega',
              icon: <Plus className="h-4 w-4" />,
              onClick: handleCreate,
              variant: 'default'
            }
          ]}
          search={{
            enabled: true,
            placeholder: "Buscar bodegas..."
          }}
          emptyState={{
            icon: <Building2 className="h-16 w-16 text-muted-foreground/50" />,
            title: 'No hay bodegas aún',
            description: 'Crea bodegas para organizar y gestionar tu inventario por ubicaciones',
            action: (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Bodega
              </Button>
            ),
          }}
          features={{
            columnVisibility: true,
          }}
          getRowId={(row) => row.id}
        />
      
        <WarehouseFormDrawer 
          open={isDrawerOpen} 
          onOpenChange={setIsDrawerOpen}
          warehouse={selectedWarehouse}
          slug={slug}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
          }}
        />
      </div>
    </ErrorBoundary>
  );
}


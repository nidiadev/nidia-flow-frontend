'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table } from '@/components/table';
import { attributesApi, Attribute } from '@/lib/api/products';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { AttributeFormDrawer } from '@/components/products/attribute-form-drawer';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { TableRowAction } from '@/components/table/types';

export default function AttributesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const queryClient = useQueryClient();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | undefined>(undefined);

  const { data: attributesData, isLoading, error, refetch } = useQuery({
    queryKey: ['attributes', slug],
    queryFn: async () => {
      const response = await attributesApi.getAll();
      return response;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => attributesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
      toast.success('Atributo eliminado');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const handleCreate = () => {
    setSelectedAttribute(undefined);
    setIsDrawerOpen(true);
  };

  const handleEdit = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setIsDrawerOpen(true);
  };

  const handleDelete = (attribute: Attribute) => {
    if (confirm(`¿Estás seguro de eliminar el atributo "${attribute.name}"?`)) {
      deleteMutation.mutate(attribute.id);
    }
  };

  const columns: ColumnDef<Attribute>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Nombre',
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const typeMap: Record<string, string> = {
            text: 'Texto',
            color: 'Color',
            number: 'Número',
            select: 'Lista'
        };
        return <Badge variant="outline">{typeMap[row.original.type] || row.original.type}</Badge>;
      },
    },
    {
      accessorKey: 'isRequired',
      header: 'Obligatorio',
      cell: ({ row }) => (
          row.original.isRequired ? <Badge variant="default">Sí</Badge> : <span className="text-muted-foreground text-sm">No</span>
      )
    },
    {
      accessorKey: 'values',
      header: 'Valores',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.values?.slice(0, 5).map(val => (
             <Badge key={val.id} variant="secondary" className="text-xs flex items-center gap-1">
                {row.original.type === 'color' && val.value && (
                    <span className="w-2 h-2 rounded-full block border" style={{ backgroundColor: val.value }}></span>
                )}
                {val.name}
             </Badge>
          ))}
          {(row.original.values?.length || 0) > 5 && (
            <span className="text-xs text-muted-foreground">+{row.original.values!.length - 5} más</span>
          )}
        </div>
      ),
    },
  ], []);

  const rowActions: TableRowAction<Attribute>[] = useMemo(() => [
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (attribute) => handleEdit(attribute),
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      separator: true,
      onClick: (attribute) => handleDelete(attribute),
    },
  ], []);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <SectionHeader
          title="Atributos de Producto"
          description="Define características reutilizables para tus productos (colores, tallas, materiales, etc.)"
        />

        <Table
          id="attributes"
          data={attributesData?.data || []}
          columns={columns}
          isLoading={isLoading}
          isError={!!error}
          error={error as Error | null}
          onRetry={refetch}
          rowActions={rowActions}
          actions={[
            {
              label: 'Nuevo Atributo',
              icon: <Plus className="h-4 w-4" />,
              onClick: handleCreate,
              variant: 'default'
            }
          ]}
          search={{
            enabled: true,
            placeholder: "Buscar atributos..."
          }}
          emptyState={{
            icon: <Tag className="h-16 w-16 text-muted-foreground/50" />,
            title: 'No hay atributos aún',
            description: 'Crea atributos para definir características reutilizables de tus productos (colores, tallas, materiales, etc.)',
            action: (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Atributo
              </Button>
            ),
          }}
          features={{
            columnVisibility: true,
          }}
          getRowId={(row) => row.id}
        />
        
        <AttributeFormDrawer 
          open={isDrawerOpen} 
          onOpenChange={setIsDrawerOpen}
          attribute={selectedAttribute}
          slug={slug}
          onSuccess={() => {
            // Invalidar todas las queries de atributos para actualización en tiempo real
            queryClient.invalidateQueries({ queryKey: ['attributes'] });
          }}
        />
      </div>
    </ErrorBoundary>
  );
}


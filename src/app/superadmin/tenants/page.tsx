'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { TenantsTable } from '@/components/tenants/tenants-table';
import { TenantForm, TenantFormRef } from '@/components/tenants/tenant-form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { tenantsApi, Tenant, CreateTenantDto } from '@/lib/api/tenants';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function TenantsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createFormRef = useRef<TenantFormRef>(null);
  const editFormRef = useRef<TenantFormRef>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tenants with real-time updates
  const { data, isLoading, error } = useQuery({
    queryKey: ['tenants', searchTerm],
    queryFn: () => tenantsApi.list({ search: searchTerm || undefined }),
    retry: 1, // Solo reintentar una vez
    retryOnMount: false, // No reintentar al montar
    refetchInterval: 5000, // Refrescar cada 5 segundos para actualización en tiempo real
    refetchOnWindowFocus: true, // Refrescar cuando la ventana recupera el foco
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: tenantsApi.create,
    onSuccess: (newTenant) => {
      // Invalidar y refetch inmediatamente
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      // También agregar optimísticamente el nuevo tenant a la cache
      queryClient.setQueryData(['tenants', searchTerm], (old: any) => {
        if (!old) return { data: [newTenant], pagination: undefined };
        return {
          ...old,
          data: [newTenant, ...(old.data || [])],
        };
      });
      setIsCreateDialogOpen(false);
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear cliente');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTenantDto }) =>
      tenantsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsEditDialogOpen(false);
      setSelectedTenant(null);
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar cliente');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: tenantsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsDeleteDialogOpen(false);
      setSelectedTenant(null);
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar cliente');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      tenantsApi.updateStatus(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsStatusDialogOpen(false);
      setSelectedTenant(null);
      toast.success('Estado del cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar estado');
    },
  });

  const handleCreate = async (data: CreateTenantDto) => {
    await createMutation.mutateAsync(data);
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: CreateTenantDto) => {
    if (!selectedTenant) return;
    await updateMutation.mutateAsync({ id: selectedTenant.id, data });
  };

  const handleDelete = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTenant) return;
    await deleteMutation.mutateAsync(selectedTenant.id);
  };

  const handleToggleStatus = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsStatusDialogOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedTenant) return;
    await updateStatusMutation.mutateAsync({
      id: selectedTenant.id,
      isActive: !selectedTenant.isActive,
    });
  };

  const handleView = (tenant: Tenant) => {
    router.push(`/superadmin/tenants/${tenant.id}`);
  };

  const tenants = data?.data || [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestión de Clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administra todas las empresas registradas en el sistema
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>
              Lista de todas las empresas registradas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-12 text-destructive">
                <p>Error al cargar clientes</p>
                <p className="text-sm mt-2 text-muted-foreground">
                  {error instanceof Error ? error.message : 'Error desconocido'}
                </p>
              </div>
            ) : (
              <TenantsTable
                data={tenants}
                isLoading={isLoading}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Sheet */}
      <Sheet open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
          {/* Fixed Header */}
          <SheetHeader className="text-left border-b pb-4 px-6 pt-6 bg-background sticky top-0 z-10">
            <SheetTitle>Crear Nuevo Cliente</SheetTitle>
            <SheetDescription>
              Completa la información para crear un nuevo cliente en el sistema
            </SheetDescription>
          </SheetHeader>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TenantForm
              ref={createFormRef}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
              showActions={false}
            />
          </div>
          
          {/* Fixed Footer */}
          <div className="border-t border-border bg-background px-6 py-4 sticky bottom-0 z-10">
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)} 
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => createFormRef.current?.submit()}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Cliente
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
          {/* Fixed Header */}
          <SheetHeader className="text-left border-b pb-4 px-6 pt-6 bg-background sticky top-0 z-10">
            <SheetTitle>Editar Cliente</SheetTitle>
            <SheetDescription>
              Modifica la información del cliente
            </SheetDescription>
          </SheetHeader>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {selectedTenant && (
              <TenantForm
                ref={editFormRef}
                defaultValues={selectedTenant}
                onSubmit={handleUpdate}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedTenant(null);
                }}
                isLoading={updateMutation.isPending}
                showActions={false}
              />
            )}
          </div>
          
          {/* Fixed Footer */}
          <div className="border-t border-border bg-background px-6 py-4 sticky bottom-0 z-10">
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedTenant(null);
                }} 
                disabled={updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => editFormRef.current?.submit()}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar Cliente
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el cliente{' '}
              <strong>{selectedTenant?.name}</strong> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Toggle Confirmation Dialog */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar Estado del Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas{' '}
              {selectedTenant?.isActive ? 'desactivar' : 'activar'} el cliente{' '}
              <strong>{selectedTenant?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus}>
              {updateStatusMutation.isPending
                ? 'Actualizando...'
                : selectedTenant?.isActive
                ? 'Desactivar'
                : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

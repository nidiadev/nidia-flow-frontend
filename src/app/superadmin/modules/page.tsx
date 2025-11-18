'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { ModulesTable } from '@/components/modules/modules-table';
import { ModuleForm, ModuleFormRef } from '@/components/modules/module-form';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/loading';
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
import { modulesApi, Module } from '@/lib/api/modules';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ModulesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createFormRef = useRef<ModuleFormRef>(null);
  const editFormRef = useRef<ModuleFormRef>(null);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Fetch modules
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['modules'],
    queryFn: () => modulesApi.list(true), // Include inactive
    retry: 1,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: modulesApi.create,
    onSuccess: (newModule) => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.setQueryData(['modules'], (old: Module[] | undefined) => {
        if (!old) return [newModule];
        return [newModule, ...old];
      });
      setIsCreateSheetOpen(false);
      toast.success('Módulo creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear módulo');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Module> }) =>
      modulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      setIsEditSheetOpen(false);
      setSelectedModule(null);
      toast.success('Módulo actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar módulo');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: modulesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      setIsDeleteDialogOpen(false);
      setSelectedModule(null);
      toast.success('Módulo eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar módulo');
    },
  });

  const handleCreate = async (data: any) => {
    await createMutation.mutateAsync(data);
  };

  const handleEdit = async (data: any) => {
    if (!selectedModule) return;
    await updateMutation.mutateAsync({ id: selectedModule.id, data });
  };

  const handleDelete = async () => {
    if (!selectedModule) return;
    await deleteMutation.mutateAsync(selectedModule.id);
  };

  const handleEditClick = (module: Module) => {
    setSelectedModule(module);
    setIsEditSheetOpen(true);
  };

  const handleDeleteClick = (module: Module) => {
    setSelectedModule(module);
    setIsDeleteDialogOpen(true);
  };

  const handleViewPlans = (module: Module) => {
    router.push(`/superadmin/modules/${module.id}/plans`);
  };

  const handleView = (module: Module) => {
    router.push(`/superadmin/modules/${module.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Gestión de Módulos"
        description="Administra los módulos disponibles en la plataforma"
        actions={
          <Button onClick={() => setIsCreateSheetOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Módulo
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Módulos del Sistema</CardTitle>
              <CardDescription>
                Configura los módulos disponibles para asignar a los planes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>Error al cargar los módulos</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          ) : (
            <ModulesTable
              modules={modules || []}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onViewPlans={handleViewPlans}
              onView={handleView}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Sheet */}
      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
            <SheetTitle>Crear Nuevo Módulo</SheetTitle>
            <SheetDescription>
              Completa la información para crear un nuevo módulo del sistema
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ModuleForm
              ref={createFormRef}
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
              mode="create"
            />
          </div>
          <div className="sticky bottom-0 bg-background border-t pt-4 mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsCreateSheetOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createFormRef.current?.submit()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Módulo
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
            <SheetTitle>Editar Módulo</SheetTitle>
            <SheetDescription>
              Modifica la información del módulo del sistema
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedModule && (
              <ModuleForm
                ref={editFormRef}
                defaultValues={{
                  name: selectedModule.name,
                  displayName: selectedModule.displayName,
                  description: selectedModule.description,
                  icon: selectedModule.icon,
                  path: selectedModule.path,
                  category: selectedModule.category,
                  sortOrder: selectedModule.sortOrder,
                  isActive: selectedModule.isActive,
                  isVisible: selectedModule.isVisible,
                }}
                onSubmit={handleEdit}
                isLoading={updateMutation.isPending}
                mode="edit"
              />
            )}
          </div>
          <div className="sticky bottom-0 bg-background border-t pt-4 mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditSheetOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => editFormRef.current?.submit()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Módulo
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el módulo{' '}
              <strong>{selectedModule?.displayName}</strong> y todas sus asignaciones a planes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}


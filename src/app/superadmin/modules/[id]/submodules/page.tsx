'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Layers,
  Plus,
  Loader2,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { modulesApi } from '@/lib/api/modules';
import { subModulesApi, SubModule } from '@/lib/api/submodules';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/loading';
import { DataTable, DataTableAction } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useRef } from 'react';
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
import { toast } from 'sonner';
import { SubModuleForm, SubModuleFormRef } from '@/components/modules/submodule-form';

export default function ModuleSubModulesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const moduleId = params.id as string;
  const createFormRef = useRef<SubModuleFormRef>(null);
  const editFormRef = useRef<SubModuleFormRef>(null);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubModule, setSelectedSubModule] = useState<SubModule | null>(null);

  // Fetch module
  const { data: module, isLoading: isLoadingModule } = useQuery({
    queryKey: ['modules', moduleId],
    queryFn: () => modulesApi.get(moduleId),
    enabled: !!moduleId,
  });

  // Fetch submodules
  const { data: subModules, isLoading: isLoadingSubModules } = useQuery({
    queryKey: ['submodules', moduleId],
    queryFn: () => subModulesApi.list(moduleId, true),
    enabled: !!moduleId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: subModulesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submodules', moduleId] });
      setIsCreateSheetOpen(false);
      toast.success('Submódulo creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear submódulo');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      // Remover moduleId si está presente (no se puede actualizar)
      const { moduleId, ...updateData } = data;
      return subModulesApi.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submodules', moduleId] });
      setIsEditSheetOpen(false);
      setSelectedSubModule(null);
      toast.success('Submódulo actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar submódulo');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: subModulesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submodules', moduleId] });
      setIsDeleteDialogOpen(false);
      setSelectedSubModule(null);
      toast.success('Submódulo eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar submódulo');
    },
  });

  const handleCreate = async (data: any) => {
    await createMutation.mutateAsync({ ...data, moduleId });
  };

  const handleEdit = async (data: any) => {
    if (!selectedSubModule) return;
    await updateMutation.mutateAsync({ id: selectedSubModule.id, data });
  };

  const handleEditClick = (subModule: SubModule) => {
    setSelectedSubModule(subModule);
    setIsEditSheetOpen(true);
  };

  const handleDeleteClick = (subModule: SubModule) => {
    setSelectedSubModule(subModule);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!selectedSubModule) return;
    deleteMutation.mutateAsync(selectedSubModule.id);
  };

  const handleView = (subModule: SubModule) => {
    router.push(`/superadmin/submodules/${subModule.id}`);
  };

  const columns: ColumnDef<SubModule>[] = [
    {
      accessorKey: 'displayName',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.icon && (
            <span className="text-muted-foreground">{row.original.icon}</span>
          )}
          <div>
            <div className="font-medium">{row.original.displayName}</div>
            {row.original.description && (
              <div className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'path',
      header: 'Ruta',
      cell: ({ row }) =>
        row.original.path ? (
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {row.original.path}
          </code>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge
            variant={row.original.isActive ? 'default' : 'secondary'}
            className={
              row.original.isActive
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : ''
            }
          >
            {row.original.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
          {!row.original.isVisible && (
            <EyeOff className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      accessorKey: 'permissions',
      header: 'Permisos',
      cell: ({ row }) =>
        row.original.permissions && row.original.permissions.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.original.permissions.slice(0, 2).map((perm) => (
              <Badge key={perm} variant="outline" className="text-xs">
                {perm}
              </Badge>
            ))}
            {row.original.permissions.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{row.original.permissions.length - 2}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: 'sortOrder',
      header: 'Orden',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.sortOrder}</span>
      ),
    },
  ];

  const actions: DataTableAction<SubModule>[] = [
    {
      label: 'Ver detalles',
      icon: Eye,
      onClick: (subModule) => handleView(subModule),
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: (subModule) => handleEditClick(subModule),
      separator: true,
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      onClick: (subModule) => handleDeleteClick(subModule),
      variant: 'destructive',
      separator: true,
    },
  ];

  if (isLoadingModule || isLoadingSubModules) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando submódulos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title={`Submódulos - ${module?.displayName || 'Módulo'}`}
          description="Gestiona los submódulos de este módulo"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push(`/superadmin/modules/${moduleId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Módulo
              </Button>
              <Button onClick={() => setIsCreateSheetOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Submódulo
              </Button>
            </div>
          }
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Submódulos del Módulo</CardTitle>
                <CardDescription>
                  Configura los submódulos disponibles para este módulo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSubModules ? (
              <TableSkeleton rows={5} columns={5} />
            ) : (
              <DataTable
                columns={columns}
                data={subModules || []}
                actions={actions}
                searchPlaceholder="Buscar submódulos..."
                onRowClick={(subModule) => handleView(subModule)}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Sheet */}
      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
            <SheetTitle>Crear Nuevo Submódulo</SheetTitle>
            <SheetDescription>
              Completa la información para crear un nuevo submódulo
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <SubModuleForm
              ref={createFormRef}
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
              mode="create"
              moduleId={moduleId}
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
              Crear Submódulo
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
            <SheetTitle>Editar Submódulo</SheetTitle>
            <SheetDescription>Modifica la información del submódulo</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedSubModule && (
              <SubModuleForm
                ref={editFormRef}
                defaultValues={{
                  name: selectedSubModule.name,
                  displayName: selectedSubModule.displayName,
                  description: selectedSubModule.description,
                  icon: selectedSubModule.icon,
                  path: selectedSubModule.path,
                  sortOrder: selectedSubModule.sortOrder,
                  isActive: selectedSubModule.isActive,
                  isVisible: selectedSubModule.isVisible,
                  permissions: selectedSubModule.permissions || [],
                }}
                onSubmit={handleEdit}
                isLoading={updateMutation.isPending}
                mode="edit"
                moduleId={moduleId}
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
              Actualizar Submódulo
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el submódulo{' '}
              <strong>{selectedSubModule?.displayName}</strong> y todas sus asignaciones a planes.
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
    </>
  );
}


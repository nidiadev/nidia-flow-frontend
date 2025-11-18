'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Plus, Loader2, Lock } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { PageHeader } from '@/components/ui/page-header';
import { RolesTable } from '@/components/users/roles-table';
import { RoleForm, RoleFormRef } from '@/components/users/role-form';
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
import { rolesApi, Role, CreateRoleDto, UpdateRoleDto } from '@/lib/api/roles';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function RolesSettingsPage() {
  const queryClient = useQueryClient();
  const createFormRef = useRef<RoleFormRef>(null);
  const editFormRef = useRef<RoleFormRef>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Fetch roles
  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
    retry: 1,
    retryOnMount: false,
  });

  // Fetch permissions
  const { data: permissionsByModule, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['roles-permissions'],
    queryFn: () => rolesApi.getPermissions(),
    retry: 1,
    retryOnMount: false,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsCreateDialogOpen(false);
      toast.success('Rol creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear rol');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleDto }) =>
      rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsEditDialogOpen(false);
      setSelectedRole(null);
      toast.success('Rol actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar rol');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
      toast.success('Rol eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar rol');
    },
  });

  const handleCreate = async (data: CreateRoleDto | UpdateRoleDto) => {
    await createMutation.mutateAsync(data as CreateRoleDto);
  };

  const handleEdit = (role: Role) => {
    if (role.isSystemRole) {
      toast.info('Los roles del sistema no se pueden editar');
      return;
    }
    setSelectedRole(role);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: CreateRoleDto | UpdateRoleDto) => {
    if (!selectedRole) return;
    await updateMutation.mutateAsync({ id: selectedRole.id, data: data as UpdateRoleDto });
  };

  const handleDelete = (role: Role) => {
    if (role.isSystemRole) {
      toast.info('Los roles del sistema no se pueden eliminar');
      return;
    }
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRole) return;
    await deleteMutation.mutateAsync(selectedRole.id);
  };

  const systemRoles = roles?.filter((r) => r.isSystemRole) || [];
  const customRoles = roles?.filter((r) => !r.isSystemRole) || [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <TenantLink href="/settings/users">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Usuarios
          </Button>
        </TenantLink>

        <PageHeader
          title="Roles y Permisos"
          description="Gestiona roles personalizados y sus permisos. Los roles del sistema no se pueden modificar."
          variant="gradient"
          actions={
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Rol
            </Button>
          }
        />

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-nidia-purple" />
              Información sobre Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Los <strong>roles del sistema</strong> son predefinidos y no se pueden modificar ni eliminar.
                Incluyen: Administrador, Gerente, Ventas, Operador, Contador y Visualizador.
              </p>
              <p>
                Los <strong>roles personalizados</strong> te permiten crear roles específicos para tu organización
                con permisos personalizados.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-nidia-purple" />
                <CardTitle className="text-base">Total</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{roles?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Roles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-nidia-green" />
                <CardTitle className="text-base">Sistema</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{systemRoles.length}</p>
              <p className="text-sm text-muted-foreground">Roles del sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-nidia-blue" />
                <CardTitle className="text-base">Personalizados</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{customRoles.length}</p>
              <p className="text-sm text-muted-foreground">Roles personalizados</p>
            </CardContent>
          </Card>
        </div>

        {/* Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              {roles?.length || 0} rol{roles?.length !== 1 ? 'es' : ''} en total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRoles || isLoadingPermissions ? (
              <TableSkeleton rows={5} columns={4} />
            ) : (
              <RolesTable
                data={roles || []}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoadingRoles}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Role Sheet */}
      <Sheet open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <SheetContent className="sm:max-w-3xl overflow-y-auto">
          <SheetHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
            <SheetTitle>Crear Nuevo Rol</SheetTitle>
            <SheetDescription>
              Crea un rol personalizado con permisos específicos para tu organización
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {permissionsByModule ? (
              <RoleForm
                ref={createFormRef}
                permissionsByModule={permissionsByModule}
                onSubmit={handleCreate}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={createMutation.isPending}
                isEdit={false}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Role Sheet */}
      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent className="sm:max-w-3xl overflow-y-auto">
          <SheetHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
            <SheetTitle>Editar Rol</SheetTitle>
            <SheetDescription>
              Actualiza el nombre, descripción y permisos del rol
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedRole && permissionsByModule ? (
              <RoleForm
                ref={editFormRef}
                defaultValues={selectedRole}
                permissionsByModule={permissionsByModule}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditDialogOpen(false)}
                isLoading={updateMutation.isPending}
                isEdit={true}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el rol <strong>{selectedRole?.name}</strong>. 
              Esta acción no se puede deshacer. Asegúrate de que ningún usuario esté usando este rol.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


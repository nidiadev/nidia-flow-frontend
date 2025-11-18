'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Shield, UserPlus, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SystemUsersTable } from '@/components/system-users/system-users-table';
import { SystemUserForm, SystemUserFormRef } from '@/components/system-users/system-user-form';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCardSkeleton, TableSkeleton } from '@/components/ui/loading';
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
import { systemUsersApi, SystemUser, CreateSystemUserDto, UpdateSystemUserDto } from '@/lib/api/system-users';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SystemUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createFormRef = useRef<SystemUserFormRef>(null);
  const editFormRef = useRef<SystemUserFormRef>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['system-users-stats'],
    queryFn: () => systemUsersApi.getStats(),
    retry: 1,
    retryOnMount: false,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Fetch users with real-time updates
  const { data, isLoading, error } = useQuery({
    queryKey: ['system-users'],
    queryFn: () => systemUsersApi.list({ limit: 50 }),
    retry: 1,
    retryOnMount: false,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: systemUsersApi.create,
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-users-stats'] });
      queryClient.setQueryData(['system-users'], (old: any) => {
        if (!old) return { data: [newUser], pagination: undefined };
        return {
          ...old,
          data: [newUser, ...(old.data || [])],
        };
      });
      setIsCreateDialogOpen(false);
      toast.success('Usuario del sistema creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear usuario del sistema');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSystemUserDto }) =>
      systemUsersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-users-stats'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast.success('Usuario del sistema actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar usuario del sistema');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: systemUsersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-users-stats'] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast.success('Usuario del sistema eliminado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar usuario del sistema');
    },
  });

  const handleCreate = async (data: CreateSystemUserDto | UpdateSystemUserDto) => {
    await createMutation.mutateAsync(data as CreateSystemUserDto);
  };

  const handleEdit = (user: SystemUser) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: CreateSystemUserDto | UpdateSystemUserDto) => {
    if (!selectedUser) return;
    await updateMutation.mutateAsync({ id: selectedUser.id, data: data as UpdateSystemUserDto });
  };

  const handleDelete = (user: SystemUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    await deleteMutation.mutateAsync(selectedUser.id);
  };

  const handleView = (user: SystemUser) => {
    router.push(`/superadmin/users/${user.id}`);
  };

  const users = data?.data || [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <PageHeader
          title="Usuarios del Sistema"
          description="Gestión de usuarios administrativos del sistema"
          actions={
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/superadmin/users/superadmins">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-nidia-purple" />
                  <CardTitle className="text-base">Super Admins</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.superAdmins || 0}</p>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/superadmin/users/support">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-nidia-green" />
                  <CardTitle className="text-base">Soporte</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.support || 0}</p>
                <p className="text-sm text-muted-foreground">Usuarios de soporte</p>
              </CardContent>
            </Card>
          </Link>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-nidia-blue" />
                <CardTitle className="text-base">Total</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Usuarios del sistema</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              Todos los usuarios administrativos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-12 text-destructive">
                <p>Error al cargar usuarios del sistema</p>
                <p className="text-sm mt-2 text-muted-foreground">
                  {error instanceof Error ? error.message : 'Error desconocido'}
                </p>
              </div>
            ) : (
              <SystemUsersTable
                data={users}
                isLoading={isLoading}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Sheet */}
      <Sheet open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
          <SheetHeader className="text-left border-b pb-4 px-6 pt-6 bg-background sticky top-0 z-10">
            <SheetTitle>Crear Nuevo Usuario del Sistema</SheetTitle>
            <SheetDescription>
              Completa la información para crear un nuevo usuario administrativo
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <SystemUserForm
              ref={createFormRef}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
              showActions={false}
            />
          </div>
          
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
                Crear Usuario
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
          <SheetHeader className="text-left border-b pb-4 px-6 pt-6 bg-background sticky top-0 z-10">
            <SheetTitle>Editar Usuario del Sistema</SheetTitle>
            <SheetDescription>
              Modifica la información del usuario
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {selectedUser && (
              <SystemUserForm
                ref={editFormRef}
                defaultValues={selectedUser}
                onSubmit={handleUpdate}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedUser(null);
                }}
                isLoading={updateMutation.isPending}
                showActions={false}
                isEdit={true}
              />
            )}
          </div>
          
          <div className="border-t border-border bg-background px-6 py-4 sticky bottom-0 z-10">
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedUser(null);
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
                Actualizar Usuario
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
              Esta acción desactivará permanentemente el usuario{' '}
              <strong>{selectedUser?.email}</strong>. El usuario no podrá iniciar sesión.
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
    </>
  );
}


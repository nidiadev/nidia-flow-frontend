'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Layers,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Calendar,
  AlertCircle,
  Package,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { subModulesApi, SubModule } from '@/lib/api/submodules';
import { toast } from 'sonner';
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
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function SubModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const subModuleId = params.id as string;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch submodule details
  const { data: subModule, isLoading, error } = useQuery({
    queryKey: ['submodules', subModuleId],
    queryFn: () => subModulesApi.get(subModuleId),
    enabled: !!subModuleId,
    retry: 1,
  });

  // Fetch submodule with plan status
  const { data: subModuleWithStatus } = useQuery({
    queryKey: ['submodules', 'with-plan-status'],
    queryFn: () => subModulesApi.getWithPlanStatus(),
    select: (data) => data.find((sm) => sm.id === subModuleId),
    enabled: !!subModuleId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: subModulesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submodules'] });
      toast.success('Submódulo eliminado exitosamente');
      if (subModule?.moduleId) {
        router.push(`/superadmin/modules/${subModule.moduleId}/submodules`);
      } else {
        router.push('/superadmin/modules');
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar submódulo');
    },
  });

  const handleDelete = () => {
    if (!subModule) return;
    deleteMutation.mutateAsync(subModule.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando información del submódulo...</p>
        </div>
      </div>
    );
  }

  if (error || !subModule) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Submódulo no encontrado</h3>
              <p className="text-muted-foreground mb-4">
                No se pudo cargar la información del submódulo.
              </p>
              <Button asChild>
                <Link href="/superadmin/modules">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Módulos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const enabledPlans = subModuleWithStatus?.planStatus?.filter((p) => p.isEnabled) || [];
  const disabledPlans = subModuleWithStatus?.planStatus?.filter((p) => !p.isEnabled) || [];

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
          <div className="space-y-2">
            <Link
              href={
                subModule.moduleId
                  ? `/superadmin/modules/${subModule.moduleId}/submodules`
                  : '/superadmin/modules'
              }
            >
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {subModule.icon ? (
                  <span className="text-primary text-2xl">{subModule.icon}</span>
                ) : (
                  <Layers className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {subModule.displayName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {subModule.isActive ? (
                    <Badge
                      variant="default"
                      className="gap-1 bg-green-500/10 text-green-600 dark:text-green-400"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Inactivo
                    </Badge>
                  )}
                  {!subModule.isVisible && (
                    <Badge variant="outline" className="gap-1">
                      <EyeOff className="h-3 w-3" />
                      Oculto
                    </Badge>
                  )}
                  {subModule.isVisible && (
                    <Badge variant="secondary" className="gap-1">
                      <Eye className="h-3 w-3" />
                      Visible
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/superadmin/modules/${subModule.moduleId}/submodules`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Nombre para Mostrar
                    </p>
                    <p className="text-sm font-medium">{subModule.displayName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      ID del Submódulo
                    </p>
                    <p className="text-sm font-medium font-mono">{subModule.name}</p>
                  </div>
                  {subModule.path && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Ruta</p>
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {subModule.path}
                      </code>
                    </div>
                  )}
                  {subModule.module && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Módulo</p>
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => router.push(`/superadmin/modules/${subModule.moduleId}`)}
                      >
                        {subModule.module.displayName}
                      </Button>
                    </div>
                  )}
                  {subModule.description && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Descripción</p>
                      <p className="text-sm text-foreground">{subModule.description}</p>
                    </div>
                  )}
                  {subModule.icon && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Icono</p>
                      <span className="text-2xl">{subModule.icon}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Permisos */}
            {subModule.permissions && subModule.permissions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Permisos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {subModule.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Asignaciones a Planes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Asignaciones a Planes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subModuleWithStatus?.planStatus && subModuleWithStatus.planStatus.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enabledPlans.map((planStatus) => (
                        <TableRow key={planStatus.planId}>
                          <TableCell className="font-medium">
                            {planStatus.planDisplayName || planStatus.planName}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                              Habilitado
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/superadmin/plans/${planStatus.planId}`)}
                            >
                              Ver Plan
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {disabledPlans.map((planStatus) => (
                        <TableRow key={planStatus.planId}>
                          <TableCell className="font-medium">
                            {planStatus.planDisplayName || planStatus.planName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Deshabilitado</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/superadmin/plans/${planStatus.planId}`)}
                            >
                              Ver Plan
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Este submódulo no está asignado a ningún plan.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Configuración */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Orden de Visualización
                  </p>
                  <p className="text-sm font-medium">{subModule.sortOrder}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Estado</p>
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant={subModule.isActive ? 'default' : 'secondary'}
                      className={
                        subModule.isActive
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 w-fit'
                          : 'w-fit'
                      }
                    >
                      {subModule.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge
                      variant={subModule.isVisible ? 'default' : 'outline'}
                      className={
                        subModule.isVisible
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit'
                          : 'w-fit'
                      }
                    >
                      {subModule.isVisible ? 'Visible' : 'Oculto'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información del Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Información del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">ID Interno</p>
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {subModule.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Fecha de Creación</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(subModule.createdAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Última Actualización
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(subModule.updatedAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el submódulo{' '}
              <strong>{subModule.displayName}</strong> y todas sus asignaciones a planes.
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


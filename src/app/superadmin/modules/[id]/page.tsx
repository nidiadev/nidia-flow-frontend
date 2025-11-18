'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Package,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Calendar,
  AlertCircle,
  Code,
  Tag,
  FileText,
  Settings,
  Layers,
  Plus,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { modulesApi, Module } from '@/lib/api/modules';
import { subModulesApi, SubModule } from '@/lib/api/submodules';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const moduleId = params.id as string;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch module details
  const { data: module, isLoading, error } = useQuery({
    queryKey: ['modules', moduleId],
    queryFn: () => modulesApi.get(moduleId),
    enabled: !!moduleId,
    retry: 1,
  });

  // Fetch module with plan status to show assignments
  const { data: moduleWithStatus } = useQuery({
    queryKey: ['modules', 'with-plan-status'],
    queryFn: () => modulesApi.getWithPlanStatus(),
    select: (data) => data.find((m) => m.id === moduleId),
    enabled: !!moduleId,
  });

  // Fetch submodules for this module
  const { data: subModules, isLoading: isLoadingSubModules } = useQuery({
    queryKey: ['submodules', moduleId],
    queryFn: () => subModulesApi.list(moduleId, true),
    enabled: !!moduleId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: modulesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Módulo eliminado exitosamente');
      router.push('/superadmin/modules');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar módulo');
    },
  });

  const handleDelete = () => {
    if (!module) return;
    deleteMutation.mutateAsync(module.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando información del módulo...</p>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Módulo no encontrado</h3>
              <p className="text-muted-foreground mb-4">
                No se pudo cargar la información del módulo.
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

  const enabledPlans = moduleWithStatus?.planStatus?.filter((p) => p.isEnabled) || [];
  const disabledPlans = moduleWithStatus?.planStatus?.filter((p) => !p.isEnabled) || [];

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
            <Link href="/superadmin/modules">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Módulos
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {module.icon ? (
                  <span className="text-2xl">{module.icon}</span>
                ) : (
                  <Package className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {module.displayName || module.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {module.isActive ? (
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
                  {!module.isVisible && (
                    <Badge variant="outline" className="gap-1">
                      <EyeOff className="h-3 w-3" />
                      Oculto
                    </Badge>
                  )}
                  {module.isVisible && (
                    <Badge variant="secondary" className="gap-1">
                      <Eye className="h-3 w-3" />
                      Visible
                    </Badge>
                  )}
                  {module.category && (
                    <Badge variant="outline">{module.category}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/superadmin/modules/${module.id}/plans`)}
            >
              <Package className="h-4 w-4 mr-2" />
              Ver Planes
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/superadmin/modules`)}
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
                  <Package className="h-5 w-5" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Nombre para Mostrar
                    </p>
                    <p className="text-sm font-medium">{module.displayName || module.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">ID del Módulo</p>
                    <p className="text-sm font-medium font-mono">{module.name}</p>
                  </div>
                  {module.description && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Descripción</p>
                      <p className="text-sm text-foreground">{module.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Ruta</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {module.path}
                    </code>
                  </div>
                  {module.category && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Categoría</p>
                      <Badge variant="outline">{module.category}</Badge>
                    </div>
                  )}
                  {module.icon && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Icono</p>
                      <p className="text-sm font-medium">{module.icon}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submódulos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Submódulos
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/superadmin/modules/${module.id}/submodules`)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Gestionar Submódulos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSubModules ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : subModules && subModules.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Ruta</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Permisos</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subModules.map((subModule) => (
                        <TableRow key={subModule.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {subModule.icon && (
                                <span className="text-muted-foreground">{subModule.icon}</span>
                              )}
                              <div>
                                <div className="font-medium">{subModule.displayName}</div>
                                {subModule.description && (
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    {subModule.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {subModule.path ? (
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                {subModule.path}
                              </code>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={subModule.isActive ? 'default' : 'secondary'}
                                className={
                                  subModule.isActive
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                    : ''
                                }
                              >
                                {subModule.isActive ? 'Activo' : 'Inactivo'}
                              </Badge>
                              {!subModule.isVisible && (
                                <EyeOff className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {subModule.permissions && subModule.permissions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {subModule.permissions.slice(0, 2).map((perm) => (
                                  <Badge key={perm} variant="outline" className="text-xs">
                                    {perm}
                                  </Badge>
                                ))}
                                {subModule.permissions.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{subModule.permissions.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/superadmin/submodules/${subModule.id}`)
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay submódulos definidos para este módulo</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => router.push(`/superadmin/modules/${module.id}/submodules`)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Submódulo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Asignaciones a Planes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Asignaciones a Planes
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/superadmin/modules/${module.id}/plans`)}
                  >
                    Gestionar Planes
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {enabledPlans.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Habilitado en {enabledPlans.length} plan{enabledPlans.length !== 1 ? 'es' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {enabledPlans.map((plan) => (
                        <Badge
                          key={plan.planId}
                          variant="default"
                          className="bg-green-500/10 text-green-600 dark:text-green-400"
                        >
                          {plan.planDisplayName || plan.planName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {disabledPlans.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Deshabilitado en {disabledPlans.length} plan{disabledPlans.length !== 1 ? 'es' : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {disabledPlans.map((plan) => (
                        <Badge key={plan.planId} variant="outline">
                          {plan.planDisplayName || plan.planName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {enabledPlans.length === 0 && disabledPlans.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Este módulo no está asignado a ningún plan.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Metadata (si existe) */}
            {module.metadata && Object.keys(module.metadata).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Metadatos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(module.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Configuración */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Orden de Visualización
                  </p>
                  <p className="text-sm font-medium">{module.sortOrder}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Estado</p>
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant={module.isActive ? 'default' : 'secondary'}
                      className={
                        module.isActive
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 w-fit'
                          : 'w-fit'
                      }
                    >
                      {module.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge
                      variant={module.isVisible ? 'default' : 'outline'}
                      className={
                        module.isVisible
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit'
                          : 'w-fit'
                      }
                    >
                      {module.isVisible ? 'Visible' : 'Oculto'}
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">ID del Módulo</p>
                  <p className="text-xs font-mono text-muted-foreground break-all">{module.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Fecha de Creación</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(module.createdAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
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
                      {format(new Date(module.updatedAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el módulo{' '}
              <strong>{module.displayName || module.name}</strong> y todas sus asignaciones a planes.
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


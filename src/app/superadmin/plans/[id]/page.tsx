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
  DollarSign,
  Users,
  Database,
  Mail,
  MessageSquare,
  Code,
  Calendar,
  Eye,
  EyeOff,
  AlertCircle,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { plansApi, Plan } from '@/lib/api/plans';
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

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const planId = params.id as string;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch plan details
  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => plansApi.getById(planId),
    enabled: !!planId,
    retry: 1,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: plansApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan eliminado exitosamente');
      router.push('/superadmin/plans');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar plan');
    },
  });

  const handleDelete = () => {
    if (!plan) return;
    deleteMutation.mutateAsync(plan.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando información del plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Plan no encontrado</h3>
              <p className="text-muted-foreground mb-4">
                No se pudo cargar la información del plan.
              </p>
              <Button asChild>
                <Link href="/superadmin/plans">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Planes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <Link href="/superadmin/plans">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Planes
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{plan.displayName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {plan.isActive ? (
                    <Badge variant="default" className="gap-1 bg-green-500/10 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Inactivo
                    </Badge>
                  )}
                  {!plan.isVisible && (
                    <Badge variant="outline" className="gap-1">
                      <EyeOff className="h-3 w-3" />
                      Oculto
                    </Badge>
                  )}
                  {plan.isVisible && (
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
              onClick={() => router.push(`/superadmin/plans/${plan.id}/modules`)}
            >
              <Package className="h-4 w-4 mr-2" />
              Módulos
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/superadmin/plans/${plan.id}/submodules`)}
            >
              <Layers className="h-4 w-4 mr-2" />
              Submódulos
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/superadmin/plans/${plan.id}/edit`)}
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
                    <p className="text-sm font-medium">{plan.displayName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">ID del Plan</p>
                    <p className="text-sm font-medium font-mono">{plan.name}</p>
                  </div>
                  {plan.description && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Descripción</p>
                      <p className="text-sm text-foreground">{plan.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Precios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Precios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Precio Mensual
                    </p>
                    {plan.priceMonthly ? (
                      <p className="text-lg font-semibold">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: plan.currency || 'USD',
                        }).format(Number(plan.priceMonthly))}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No configurado</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Precio Anual</p>
                    {plan.priceYearly ? (
                      <p className="text-lg font-semibold">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: plan.currency || 'USD',
                        }).format(Number(plan.priceYearly))}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No configurado</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Moneda</p>
                    <p className="text-sm font-medium">{plan.currency || 'USD'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Límites del Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Límites del Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.maxUsers !== null && plan.maxUsers !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Máximo de Usuarios</p>
                        <p className="text-lg font-semibold">{plan.maxUsers}</p>
                      </div>
                    </div>
                  )}
                  {plan.maxStorageGb !== null && plan.maxStorageGb !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Database className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Almacenamiento (GB)</p>
                        <p className="text-lg font-semibold">{plan.maxStorageGb} GB</p>
                      </div>
                    </div>
                  )}
                  {plan.maxMonthlyEmails !== null && plan.maxMonthlyEmails !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Emails Mensuales</p>
                        <p className="text-lg font-semibold">{plan.maxMonthlyEmails.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {plan.maxMonthlyWhatsapp !== null && plan.maxMonthlyWhatsapp !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">WhatsApp Mensuales</p>
                        <p className="text-lg font-semibold">{plan.maxMonthlyWhatsapp.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {plan.maxMonthlyApiCalls !== null && plan.maxMonthlyApiCalls !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Code className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Llamadas API Mensuales</p>
                        <p className="text-lg font-semibold">{plan.maxMonthlyApiCalls.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Módulos Habilitados */}
            {plan.enabledModules && plan.enabledModules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Módulos Habilitados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {plan.enabledModules.map((module) => (
                      <Badge key={module} variant="secondary" className="text-sm">
                        {module}
                      </Badge>
                    ))}
                  </div>
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
                  <Package className="h-5 w-5" />
                  Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Orden de Visualización</p>
                  <p className="text-sm font-medium">{plan.sortOrder}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Estado</p>
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant={plan.isActive ? 'default' : 'secondary'}
                      className={plan.isActive ? 'bg-green-500/10 text-green-600 dark:text-green-400 w-fit' : 'w-fit'}
                    >
                      {plan.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge
                      variant={plan.isVisible ? 'default' : 'outline'}
                      className={plan.isVisible ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit' : 'w-fit'}
                    >
                      {plan.isVisible ? 'Visible' : 'Oculto'}
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">ID del Plan</p>
                  <p className="text-xs font-mono text-muted-foreground break-all">{plan.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Fecha de Creación</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(plan.createdAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Última Actualización</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(plan.updatedAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stripe Integration (si existe) */}
            {(plan.stripePriceIdMonthly || plan.stripePriceIdYearly) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Integración Stripe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.stripePriceIdMonthly && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Stripe Price ID (Mensual)
                      </p>
                      <p className="text-xs font-mono text-muted-foreground break-all">
                        {plan.stripePriceIdMonthly}
                      </p>
                    </div>
                  )}
                  {plan.stripePriceIdYearly && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Stripe Price ID (Anual)
                      </p>
                      <p className="text-xs font-mono text-muted-foreground break-all">
                        {plan.stripePriceIdYearly}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el plan{' '}
              <strong>{plan.displayName}</strong> y no podrá ser asignado a nuevos clientes.
              Los clientes existentes con este plan no se verán afectados.
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


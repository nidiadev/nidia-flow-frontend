'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Building2,
  Package,
  Calendar,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Ban,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { subscriptionsApi, Subscription } from '@/lib/api/subscriptions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subscriptionId = params.id as string;

  // Fetch subscription details - actualización en tiempo real
  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['subscription', subscriptionId],
    queryFn: () => subscriptionsApi.getById(subscriptionId),
    enabled: !!subscriptionId,
    retry: 1,
    retryOnMount: false,
    refetchInterval: 5000, // Refrescar cada 5 segundos para actualización en tiempo real
    refetchOnWindowFocus: true, // Refrescar cuando la ventana recupera el foco
  });

  const getStatusBadge = (status: string, currentPeriodEnd: string) => {
    const now = new Date();
    const endDate = new Date(currentPeriodEnd);
    const isExpired = endDate < now;

    if (isExpired && status === 'active') {
      return (
        <Badge variant="destructive" className="bg-orange-500/10 text-orange-600 dark:text-orange-400">
          Vencida
        </Badge>
      );
    }

    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      cancelled: 'destructive',
      expired: 'destructive',
      trialing: 'secondary',
      past_due: 'destructive',
    };

    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-600 dark:text-green-400',
      cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
      expired: 'bg-red-500/10 text-red-600 dark:text-red-400',
      trialing: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      past_due: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    };

    return (
      <Badge
        variant={variants[status] || 'outline'}
        className={colors[status] || ''}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getBillingCycleLabel = (cycle: string) => {
    const cycleLabels: Record<string, string> = {
      monthly: 'Mensual',
      yearly: 'Anual',
      quarterly: 'Trimestral',
      semiannually: 'Semestral',
    };
    return cycleLabels[cycle] || cycle;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Suscripción no encontrada</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Error al cargar la suscripción'}
          </p>
          <Button onClick={() => router.push('/superadmin/subscriptions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Suscripciones
          </Button>
        </div>
      </div>
    );
  }

  const periodStart = new Date(subscription.currentPeriodStart);
  const periodEnd = new Date(subscription.currentPeriodEnd);
  const isExpired = periodEnd < new Date();
  const daysUntilExpiry = Math.ceil((periodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/superadmin/subscriptions')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Suscripciones
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Suscripción #{subscription.id.slice(0, 8)}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(subscription.status, subscription.currentPeriodEnd)}
                {subscription.tenant && (
                  <span className="text-sm text-muted-foreground">
                    • {subscription.tenant.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/superadmin/subscriptions/${subscriptionId}/edit`)}
          size="default"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos de la suscripción</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estado</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(subscription.status, subscription.currentPeriodEnd)}
                    {subscription.cancelAtPeriodEnd && (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        Se cancela al finalizar
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ciclo de Facturación</p>
                  <p className="font-medium">{getBillingCycleLabel(subscription.billingCycle)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                  {subscription.tenant ? (
                    <Link
                      href={`/superadmin/tenants/${subscription.tenant.id}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{subscription.tenant.name}</span>
                    </Link>
                  ) : (
                    <p className="text-muted-foreground">-</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plan</p>
                  {subscription.plan ? (
                    <Link
                      href={`/superadmin/plans/${subscription.plan.id}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{subscription.plan.displayName}</span>
                    </Link>
                  ) : (
                    <p className="text-muted-foreground">-</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Facturación */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Facturación</CardTitle>
              <CardDescription>Montos y detalles de pago</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Monto Base</p>
                  <p className="text-lg font-semibold">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: subscription.currency || 'USD',
                    }).format(Number(subscription.amount))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descuento</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: subscription.currency || 'USD',
                    }).format(Number(subscription.discountAmount || 0))}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: subscription.currency || 'USD',
                    }).format(Number(subscription.totalAmount))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Moneda</p>
                  <p className="font-medium">{subscription.currency || 'USD'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Período Actual */}
          <Card>
            <CardHeader>
              <CardTitle>Período Actual</CardTitle>
              <CardDescription>Fechas del período de facturación actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Inicio del Período</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {format(periodStart, "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fin del Período</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className={`font-medium ${isExpired ? 'text-destructive' : daysUntilExpiry <= 7 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                      {format(periodEnd, "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
                {!isExpired && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Tiempo Restante</p>
                    <p className={`font-medium ${daysUntilExpiry <= 7 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                      {daysUntilExpiry === 0
                        ? 'Vence hoy'
                        : daysUntilExpiry === 1
                        ? 'Vence mañana'
                        : daysUntilExpiry < 0
                        ? 'Vencida'
                        : `Vence en ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'día' : 'días'}`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Período de Trial */}
          {subscription.trialStart && subscription.trialEnd && (
            <Card>
              <CardHeader>
                <CardTitle>Período de Trial</CardTitle>
                <CardDescription>Información del período de prueba</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Inicio del Trial</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {format(new Date(subscription.trialStart), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fin del Trial</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {format(new Date(subscription.trialEnd), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancelación */}
          {subscription.cancelledAt && (
            <Card>
              <CardHeader>
                <CardTitle>Información de Cancelación</CardTitle>
                <CardDescription>Detalles sobre la cancelación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fecha de Cancelación</p>
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {format(new Date(subscription.cancelledAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                  {subscription.cancellationReason && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Razón de Cancelación</p>
                      <p className="font-medium">{subscription.cancellationReason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Información del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
              <CardDescription>Metadatos y fechas del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">ID de Suscripción</p>
                <p className="font-mono text-xs break-all">{subscription.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Creada</p>
                <p className="font-medium">
                  {format(new Date(subscription.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Última Actualización</p>
                <p className="font-medium">
                  {format(new Date(subscription.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Integración Stripe */}
          {(subscription.stripeCustomerId || subscription.stripeSubscriptionId) && (
            <Card>
              <CardHeader>
                <CardTitle>Integración Stripe</CardTitle>
                <CardDescription>IDs de Stripe (si aplica)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscription.stripeCustomerId && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Stripe Customer ID</p>
                    <p className="font-mono text-xs break-all">{subscription.stripeCustomerId}</p>
                  </div>
                )}
                {subscription.stripeSubscriptionId && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Stripe Subscription ID</p>
                    <p className="font-mono text-xs break-all">{subscription.stripeSubscriptionId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Información Adicional */}
          {subscription.metadata && Object.keys(subscription.metadata).length > 0 && (() => {
            // Parse metadata if it's a string
            let metadata = subscription.metadata;
            if (typeof metadata === 'string') {
              try {
                metadata = JSON.parse(metadata);
              } catch (e) {
                metadata = {};
              }
            }
            
            return (
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
                <CardDescription>Metadatos y detalles del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {metadata.createdBy && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Creado Por</p>
                    <p className="font-medium">{metadata.createdBy}</p>
                  </div>
                )}
                {metadata.createdFrom && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Origen de Creación</p>
                    <p className="font-medium capitalize">
                      {metadata.createdFrom === 'tenant_creation'
                        ? 'Creación de Cliente'
                        : metadata.createdFrom === 'tenant_update'
                        ? 'Actualización de Cliente'
                        : metadata.createdFrom}
                    </p>
                  </div>
                )}
                {metadata.tenantSlug && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Slug del Cliente</p>
                    <p className="font-medium font-mono text-sm">{metadata.tenantSlug}</p>
                  </div>
                )}
                {metadata.planChangedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Plan Cambiado</p>
                    <p className="font-medium">
                      {format(new Date(metadata.planChangedAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                )}
                {metadata.previousPlan && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Plan Anterior</p>
                    <Badge variant="outline" className="font-normal">
                      {metadata.previousPlan}
                    </Badge>
                  </div>
                )}
                {metadata.newPlan && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Plan Nuevo</p>
                    <Badge variant="outline" className="font-normal">
                      {metadata.newPlan}
                    </Badge>
                  </div>
                )}
                {/* Mostrar otros campos del metadata que no hayamos cubierto */}
                {Object.entries(metadata).some(
                  ([key]) =>
                    !['createdBy', 'createdFrom', 'tenantSlug', 'planChangedAt', 'previousPlan', 'newPlan'].includes(key)
                ) && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Otros Metadatos</p>
                    <div className="space-y-2">
                      {Object.entries(metadata)
                        .filter(
                          ([key]) =>
                            !['createdBy', 'createdFrom', 'tenantSlug', 'planChangedAt', 'previousPlan', 'newPlan'].includes(key)
                        )
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between items-start">
                            <p className="text-sm text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </p>
                            <p className="text-sm font-medium text-right max-w-[60%] break-words">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}


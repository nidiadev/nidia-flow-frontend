'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Building2,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Mail,
  Phone,
  Calendar,
  Users,
  Database,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Globe,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { tenantsApi, Tenant } from '@/lib/api/tenants';
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

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tenantId = params.id as string;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  // Fetch tenant details
  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => tenantsApi.getById(tenantId),
    enabled: !!tenantId,
    retry: 1,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: tenantsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Cliente eliminado exitosamente');
      router.push('/superadmin/tenants');
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
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsStatusDialogOpen(false);
      toast.success('Estado del cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar estado');
    },
  });

  const handleDelete = () => {
    if (!tenant) return;
    deleteMutation.mutateAsync(tenant.id);
  };

  const handleToggleStatus = () => {
    if (!tenant) return;
    updateStatusMutation.mutateAsync({
      id: tenant.id,
      isActive: !tenant.isActive,
    });
  };

  const getCompanySizeLabel = (size?: string) => {
    const labels: Record<string, string> = {
      small: 'Pequeña (1-10)',
      medium: 'Mediana (11-50)',
      large: 'Grande (51-200)',
      enterprise: 'Enterprise (200+)',
    };
    return labels[size || ''] || size || 'No especificado';
  };

  const getPlanStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trial: 'secondary',
      suspended: 'destructive',
      cancelled: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando información del cliente...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Cliente no encontrado</h3>
              <p className="text-muted-foreground mb-4">
                No se pudo cargar la información del cliente.
              </p>
              <Button asChild>
                <Link href="/superadmin/tenants">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Clientes
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
            <Link href="/superadmin/tenants">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Clientes
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {tenant.isActive ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Inactivo
                    </Badge>
                  )}
                  {tenant.isSuspended && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Suspendido
                    </Badge>
                  )}
                  {getPlanStatusBadge(tenant.planStatus)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(true)}
              disabled={updateStatusMutation.isPending}
            >
              {tenant.isActive ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Desactivar
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Activar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/superadmin/tenants/${tenant.id}/edit`)}
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
                  <Briefcase className="h-5 w-5" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Nombre de la Empresa
                    </p>
                    <p className="text-sm font-medium">{tenant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Slug</p>
                    <p className="text-sm font-medium font-mono">{tenant.slug}</p>
                  </div>
                  {tenant.companyLegalName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Razón Social
                      </p>
                      <p className="text-sm font-medium">{tenant.companyLegalName}</p>
                    </div>
                  )}
                  {tenant.taxId && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        NIT / Tax ID
                      </p>
                      <p className="text-sm font-medium">{tenant.taxId}</p>
                    </div>
                  )}
                  {tenant.industry && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Industria</p>
                      <p className="text-sm font-medium">{tenant.industry}</p>
                    </div>
                  )}
                  {tenant.companySize && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Tamaño de Empresa
                      </p>
                      <p className="text-sm font-medium">{getCompanySizeLabel(tenant.companySize)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información de Facturación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Información de Facturación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Email de Facturación
                    </p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${tenant.billingEmail}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {tenant.billingEmail}
                      </a>
                    </div>
                  </div>
                  {tenant.billingContactName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Contacto de Facturación
                      </p>
                      <p className="text-sm font-medium">{tenant.billingContactName}</p>
                    </div>
                  )}
                </div>
                {(tenant.billingAddress ||
                  tenant.billingCity ||
                  tenant.billingState ||
                  tenant.billingCountry ||
                  tenant.billingPostalCode) && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Dirección de Facturación</p>
                    <div className="space-y-1">
                      {tenant.billingAddress && (
                        <p className="text-sm font-medium">{tenant.billingAddress}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {tenant.billingCity && <span>{tenant.billingCity}</span>}
                        {tenant.billingState && <span>{tenant.billingState}</span>}
                        {tenant.billingPostalCode && <span>{tenant.billingPostalCode}</span>}
                        {tenant.billingCountry && <span>{tenant.billingCountry}</span>}
                      </div>
                    </div>
                  </div>
                )}
                {tenant.paymentMethod && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Método de Pago
                    </p>
                    <Badge variant="outline" className="capitalize">
                      {tenant.paymentMethod === 'credit_card'
                        ? 'Tarjeta de Crédito'
                        : tenant.paymentMethod === 'debit_card'
                        ? 'Tarjeta de Débito'
                        : tenant.paymentMethod === 'bank_transfer'
                        ? 'Transferencia Bancaria'
                        : tenant.paymentMethod === 'cash'
                        ? 'Efectivo'
                        : tenant.paymentMethod}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contacto Principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contacto Principal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tenant.primaryContactName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Nombre del Contacto
                      </p>
                      <p className="text-sm font-medium">{tenant.primaryContactName}</p>
                    </div>
                  )}
                  {tenant.primaryContactEmail && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Email del Contacto
                      </p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${tenant.primaryContactEmail}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {tenant.primaryContactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  {tenant.primaryContactPhone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Teléfono del Contacto
                      </p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${tenant.primaryContactPhone}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {tenant.primaryContactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información Adicional */}
            {(tenant.referralSource || tenant.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Información Adicional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tenant.referralSource && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Fuente de Referencia
                      </p>
                      <p className="text-sm font-medium">{tenant.referralSource}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cómo se enteró el cliente de NIDIA Flow
                      </p>
                    </div>
                  )}
                  {tenant.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Notas Internas</p>
                      <div className="p-3 bg-muted/50 rounded-md border border-border/50">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {tenant.notes}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Notas privadas para el equipo de NIDIA
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Plan y Suscripción */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Plan y Suscripción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Tipo de Plan</p>
                  <Badge variant="outline" className="text-sm">
                    {tenant.planType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Estado del Plan</p>
                  {getPlanStatusBadge(tenant.planStatus)}
                </div>
                {tenant.trialEndsAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Fin del Período de Prueba
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {format(new Date(tenant.trialEndsAt), "dd 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
                {tenant.subscriptionStartsAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Inicio de Suscripción
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {format(new Date(tenant.subscriptionStartsAt), "dd 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {tenant.subscriptionEndsAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Fin de la Suscripción
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {format(new Date(tenant.subscriptionEndsAt), "dd 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {tenant.lastBillingDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Última Facturación
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {format(new Date(tenant.lastBillingDate), "dd 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {tenant.nextBillingDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Próxima Facturación
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {format(new Date(tenant.nextBillingDate), "dd 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estadísticas de Uso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Estadísticas de Uso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">Usuarios</p>
                    <p className="text-sm font-semibold">
                      {tenant.currentUsers} / {tenant.maxUsers}
                    </p>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((tenant.currentUsers / tenant.maxUsers) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                {tenant.maxStorageGb !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">Almacenamiento</p>
                      <p className="text-sm font-semibold">
                        {Number(tenant.currentStorageGb || 0).toFixed(2)} / {tenant.maxStorageGb} GB
                      </p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            ((Number(tenant.currentStorageGb || 0) / Number(tenant.maxStorageGb)) * 100),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {tenant.maxMonthlyEmails !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">Emails Mensuales</p>
                      <p className="text-sm font-semibold">
                        {tenant.currentMonthlyEmails || 0} / {tenant.maxMonthlyEmails}
                      </p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            ((tenant.currentMonthlyEmails || 0) / tenant.maxMonthlyEmails) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {tenant.maxMonthlyWhatsapp !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        WhatsApp Mensuales
                      </p>
                      <p className="text-sm font-semibold">
                        {tenant.currentMonthlyWhatsapp || 0} / {tenant.maxMonthlyWhatsapp}
                      </p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            ((tenant.currentMonthlyWhatsapp || 0) / tenant.maxMonthlyWhatsapp) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {tenant.maxMonthlyApiCalls !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Llamadas API Mensuales
                      </p>
                      <p className="text-sm font-semibold">
                        {tenant.currentMonthlyApiCalls || 0} / {tenant.maxMonthlyApiCalls}
                      </p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            ((tenant.currentMonthlyApiCalls || 0) / tenant.maxMonthlyApiCalls) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Información del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">ID del Cliente</p>
                  <p className="text-xs font-mono text-muted-foreground break-all">{tenant.id}</p>
                </div>
                {tenant.provisionedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Fecha de Provisionamiento
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {format(new Date(tenant.provisionedAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {tenant.lastActivityAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Última Actividad
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {format(new Date(tenant.lastActivityAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Fecha de Creación</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {format(new Date(tenant.createdAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Última Actualización</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {format(new Date(tenant.updatedAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
                {tenant.enabledModules && tenant.enabledModules.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Módulos Habilitados</p>
                    <div className="flex flex-wrap gap-1">
                      {tenant.enabledModules.map((module) => (
                        <Badge key={module} variant="secondary" className="text-xs capitalize">
                          {module}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {tenant.stripeCustomerId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Stripe Customer ID
                    </p>
                    <p className="text-xs font-mono text-muted-foreground break-all">
                      {tenant.stripeCustomerId}
                    </p>
                  </div>
                )}
                {tenant.stripeSubscriptionId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Stripe Subscription ID
                    </p>
                    <p className="text-xs font-mono text-muted-foreground break-all">
                      {tenant.stripeSubscriptionId}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estado y Suspensión */}
            {tenant.isSuspended && tenant.suspensionReason && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Información de Suspensión
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{tenant.suspensionReason}</p>
                  {tenant.suspendedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Suspendido el{' '}
                        {format(new Date(tenant.suspendedAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </span>
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el cliente{' '}
              <strong>{tenant?.name}</strong> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
              {tenant?.isActive ? 'desactivar' : 'activar'} el cliente{' '}
              <strong>{tenant?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              {updateStatusMutation.isPending
                ? 'Actualizando...'
                : tenant?.isActive
                ? 'Desactivar'
                : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


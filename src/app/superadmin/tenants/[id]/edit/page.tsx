'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { tenantsApi, Tenant, CreateTenantDto } from '@/lib/api/tenants';
import { TenantForm, TenantFormRef } from '@/components/tenants/tenant-form';
import { toast } from 'sonner';
import { useRef } from 'react';

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tenantId = params.id as string;
  const formRef = useRef<TenantFormRef>(null);

  // Fetch tenant details
  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => tenantsApi.getById(tenantId),
    enabled: !!tenantId,
    retry: 1,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTenantDto }) =>
      tenantsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Cliente actualizado exitosamente');
      router.push(`/superadmin/tenants/${tenantId}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar cliente');
    },
  });

  const handleSubmit = async (data: CreateTenantDto) => {
    if (!tenant) return;
    await updateMutation.mutateAsync({ id: tenant.id, data });
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Link href={`/superadmin/tenants/${tenantId}`}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Detalle
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Editar Cliente</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modifica la información del cliente <span className="font-medium">{tenant.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
          <CardDescription>
            Actualiza los datos del cliente. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TenantForm
            ref={formRef}
            defaultValues={{
              name: tenant.name,
              slug: tenant.slug,
              companyLegalName: tenant.companyLegalName,
              taxId: tenant.taxId,
              industry: tenant.industry,
              companySize: tenant.companySize as 'small' | 'medium' | 'large' | 'enterprise' | undefined,
              billingEmail: tenant.billingEmail,
              billingContactName: tenant.billingContactName,
              billingAddress: tenant.billingAddress,
              billingCity: tenant.billingCity,
              billingState: tenant.billingState,
              billingCountry: tenant.billingCountry,
              billingPostalCode: tenant.billingPostalCode,
              paymentMethod: tenant.paymentMethod as 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'other' | undefined,
              primaryContactName: tenant.primaryContactName,
              primaryContactEmail: tenant.primaryContactEmail,
              primaryContactPhone: tenant.primaryContactPhone,
              planType: tenant.planType,
              referralSource: tenant.referralSource,
              notes: tenant.notes,
            }}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/superadmin/tenants/${tenantId}`)}
            isLoading={updateMutation.isPending}
            showActions={true}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}


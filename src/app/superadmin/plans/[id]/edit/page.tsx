'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { plansApi, Plan } from '@/lib/api/plans';
import { PlanForm, PlanFormRef } from '@/components/plans/plan-form';
import { toast } from 'sonner';
import { useRef } from 'react';

export default function EditPlanPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const planId = params.id as string;
  const formRef = useRef<PlanFormRef>(null);

  // Fetch plan details
  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => plansApi.getById(planId),
    enabled: !!planId,
    retry: 1,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Plan> }) =>
      plansApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan actualizado exitosamente');
      router.push(`/superadmin/plans/${planId}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar plan');
    },
  });

  const handleSubmit = async (data: Partial<Plan>) => {
    if (!plan) return;
    await updateMutation.mutateAsync({ id: plan.id, data });
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Link href={`/superadmin/plans/${planId}`}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Detalle
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Editar Plan</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modifica la información del plan <span className="font-medium">{plan.displayName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Plan</CardTitle>
          <CardDescription>
            Actualiza los datos del plan. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanForm
            ref={formRef}
            defaultValues={{
              name: plan.name,
              displayName: plan.displayName,
              description: plan.description,
              priceMonthly: plan.priceMonthly ? Number(plan.priceMonthly) : undefined,
              priceYearly: plan.priceYearly ? Number(plan.priceYearly) : undefined,
              currency: plan.currency || 'USD',
              maxUsers: plan.maxUsers || undefined,
              maxStorageGb: plan.maxStorageGb || undefined,
              maxMonthlyEmails: plan.maxMonthlyEmails || undefined,
              maxMonthlyWhatsapp: plan.maxMonthlyWhatsapp || undefined,
              maxMonthlyApiCalls: plan.maxMonthlyApiCalls || undefined,
              enabledModules: plan.enabledModules || [],
              isActive: plan.isActive,
              isVisible: plan.isVisible,
              sortOrder: plan.sortOrder,
              stripePriceIdMonthly: plan.stripePriceIdMonthly || '',
              stripePriceIdYearly: plan.stripePriceIdYearly || '',
            }}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/superadmin/plans/${planId}`)}
            isLoading={updateMutation.isPending}
            showActions={true}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}


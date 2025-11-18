'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/loading';
import { Loader2, ArrowLeft, Check, X } from 'lucide-react';
import { modulesApi, Module } from '@/lib/api/modules';
import { plansApi, Plan } from '@/lib/api/plans';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function ModulePlansPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const moduleId = params.id as string;

  // Fetch module
  const { data: module, isLoading: isLoadingModule } = useQuery({
    queryKey: ['modules', moduleId],
    queryFn: () => modulesApi.get(moduleId),
    enabled: !!moduleId,
  });

  // Fetch all plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list(),
  });

  // Fetch module with plan status
  const { data: moduleWithStatus } = useQuery({
    queryKey: ['modules', 'with-plan-status'],
    queryFn: () => modulesApi.getWithPlanStatus(),
    select: (data) => data.find((m) => m.id === moduleId),
  });

  // Assign/remove mutation
  const assignMutation = useMutation({
    mutationFn: ({ planId, isEnabled }: { planId: string; isEnabled: boolean }) =>
      modulesApi.assignToPlan({
        moduleId,
        planId,
        isEnabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules', 'with-plan-status'] });
      toast.success('Asignación actualizada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar asignación');
    },
  });

  const handleToggle = async (planId: string, currentStatus: boolean) => {
    await assignMutation.mutateAsync({
      planId,
      isEnabled: !currentStatus,
    });
  };

  if (isLoadingModule) {
    return (
      <div className="container mx-auto py-8">
        <TableSkeleton rows={5} columns={4} />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="Módulo no encontrado"
          description="El módulo solicitado no existe"
          variant="default"
          showBack
        />
      </div>
    );
  }

  const planStatusMap = new Map(
    (moduleWithStatus?.planStatus || []).map((ps) => [ps.planId, ps.isEnabled])
  );

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title={`Asignar Módulo: ${module.displayName}`}
        description="Gestiona en qué planes está disponible este módulo"
        variant="default"
        showBack
        onBack={() => router.push('/superadmin/modules')}
      />

      <Card>
        <CardHeader>
          <CardTitle>Asignación a Planes</CardTitle>
          <CardDescription>
            Activa o desactiva este módulo para cada plan de suscripción
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPlans ? (
            <TableSkeleton rows={5} columns={4} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans?.map((plan) => {
                  const isEnabled = planStatusMap.get(plan.id) ?? false;
                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        {plan.displayName}
                        <Badge variant="outline" className="ml-2">
                          {plan.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {plan.description || 'Sin descripción'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isEnabled ? 'default' : 'secondary'}
                          className={cn(
                            isEnabled && 'bg-green-500 hover:bg-green-600'
                          )}
                        >
                          {isEnabled ? (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              Habilitado
                            </>
                          ) : (
                            <>
                              <X className="mr-1 h-3 w-3" />
                              Deshabilitado
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => handleToggle(plan.id, isEnabled)}
                            disabled={assignMutation.isPending}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


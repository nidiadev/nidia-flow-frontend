'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Zap } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { workflowsApi } from '@/lib/api/crm';

const createWorkflowSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres'),
  description: z.string().optional(),
  triggerType: z.string().min(1, 'El tipo de trigger es requerido'),
  isActive: z.boolean().optional().default(true),
});

type CreateWorkflowForm = {
  name: string;
  description?: string;
  triggerType: string;
  isActive: boolean;
};

const TRIGGER_TYPES = [
  { value: 'customer_created', label: 'Cliente Creado' },
  { value: 'customer_updated', label: 'Cliente Actualizado' },
  { value: 'deal_created', label: 'Deal Creado' },
  { value: 'deal_stage_changed', label: 'Deal Cambió de Etapa' },
  { value: 'interaction_created', label: 'Interacción Creada' },
  { value: 'form_submitted', label: 'Formulario Enviado' },
];

export default function NewWorkflowPage() {
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();

  const createWorkflow = useMutation({
    mutationFn: (data: any) => workflowsApi.create(data),
    onSuccess: (response) => {
      const workflow = response.data;
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow creado exitosamente');
      router.push(route(`/crm/workflows/${workflow.id}`));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear el workflow');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateWorkflowForm>({
    resolver: zodResolver(createWorkflowSchema) as any,
    defaultValues: {
      isActive: true,
      triggerType: '',
    },
  });

  const onSubmit = async (data: CreateWorkflowForm) => {
    try {
      const workflowData = {
        ...data,
        triggerConfig: {},
        steps: [],
      };
      
      await createWorkflow.mutateAsync(workflowData);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Nueva Automatización"
          description="Crea un workflow para automatizar tareas repetitivas"
          actions={
            <Button variant="outline" asChild>
              <TenantLink href={route('/crm/workflows')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </TenantLink>
            </Button>
          }
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Información Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Nombre *
                    </Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Ej: Notificar nuevo lead"
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Describe qué hace este workflow..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="triggerType" className="text-sm font-medium">
                      Trigger (Disparador) *
                    </Label>
                    <Select
                      value={watch('triggerType')}
                      onValueChange={(value) => setValue('triggerType', value)}
                    >
                      <SelectTrigger className={errors.triggerType ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Selecciona un trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_TYPES.map((trigger) => (
                          <SelectItem key={trigger.value} value={trigger.value}>
                            {trigger.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.triggerType && (
                      <p className="text-xs text-destructive mt-1">{errors.triggerType.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register('isActive')}
                      className="h-4 w-4 rounded border-gray-300"
                      defaultChecked
                    />
                    <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                      Workflow activo
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Pasos</CardTitle>
                  <CardDescription>
                    Configura los pasos después de crear el workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">
                      Podrás configurar los pasos después de crear el workflow
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting || createWorkflow.isPending}
                      size="lg"
                    >
                      {isSubmitting || createWorkflow.isPending ? (
                        <>
                          <Save className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Crear Workflow
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}


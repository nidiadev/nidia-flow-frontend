'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QueryLoading } from '@/components/ui/loading';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { workflowsApi, Workflow } from '@/lib/api/crm';

const updateWorkflowSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres'),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type UpdateWorkflowForm = z.infer<typeof updateWorkflowSchema>;

export default function EditWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  const workflowId = params.id as string;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['workflows', workflowId],
    queryFn: async () => {
      const response = await workflowsApi.getById(workflowId);
      return response.data;
    },
  });

  const updateWorkflow = useMutation({
    mutationFn: (data: any) => workflowsApi.update(workflowId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow actualizado exitosamente');
      router.push(route(`/crm/workflows/${workflowId}`));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar el workflow');
    },
  });

  const workflow = data as Workflow | undefined;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<UpdateWorkflowForm>({
    resolver: zodResolver(updateWorkflowSchema),
  });

  useEffect(() => {
    if (workflow) {
      reset({
        name: workflow.name,
        description: workflow.description,
        isActive: workflow.isActive,
      });
    }
  }, [workflow, reset]);

  const onSubmit = async (data: UpdateWorkflowForm) => {
    try {
      await updateWorkflow.mutateAsync(data);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  if (isLoading) {
    return (
      <ErrorBoundary>
        <QueryLoading isLoading={true} isError={false} error={null} isEmpty={false}>
          <div />
        </QueryLoading>
      </ErrorBoundary>
    );
  }

  if (isError || !workflow) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <SectionHeader
            title="Workflow no encontrado"
            description="El workflow que buscas no existe o fue eliminado"
            actions={
              <Button variant="outline" asChild>
                <TenantLink href={route('/crm/workflows')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </TenantLink>
              </Button>
            }
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title={`Editar Workflow: ${workflow.name}`}
          description="Modifica el workflow"
          actions={
            <Button variant="outline" asChild>
              <TenantLink href={route(`/crm/workflows/${workflowId}`)}>
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
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register('isActive')}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                      Workflow activo
                    </Label>
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
                      disabled={isSubmitting || updateWorkflow.isPending}
                      size="lg"
                    >
                      {isSubmitting || updateWorkflow.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Cambios
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


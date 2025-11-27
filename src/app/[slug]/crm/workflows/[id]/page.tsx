'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Zap, Play, Pause, Activity } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QueryLoading } from '@/components/ui/loading';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { workflowsApi, Workflow } from '@/lib/api/crm';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  const workflowId = params.id as string;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['workflows', workflowId],
    queryFn: async () => {
      const response = await workflowsApi.getById(workflowId);
      return response.data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      workflowsApi.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', workflowId] });
      toast.success('Estado del workflow actualizado');
    },
  });

  const workflow = data as Workflow | undefined;

  if (isLoading) {
    return (
      <ErrorBoundary>
        <QueryLoading isLoading={true} isError={false} error={null} isEmpty={false} />
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
          title={workflow.name}
          description={workflow.description || 'Automatización de tareas'}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  toggleActiveMutation.mutate({ id: workflow.id, isActive: !workflow.isActive })
                }
                disabled={toggleActiveMutation.isPending}
              >
                {workflow.isActive ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {workflow.isActive ? 'Pausar' : 'Activar'}
              </Button>
              <Button variant="outline" asChild>
                <TenantLink href={route('/crm/workflows')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </TenantLink>
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {workflow.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                    {workflow.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <Badge variant="outline">{workflow.triggerType}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Pasos</CardTitle>
                <CardDescription>
                  {workflow.steps?.length || 0} pasos configurados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    La configuración de pasos se implementará próximamente
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Ejecuciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    {workflow.executionCount || 0} ejecuciones
                  </p>
                  {workflow.lastExecutedAt && (
                    <p className="text-xs mt-2">
                      Última ejecución: {format(new Date(workflow.lastExecutedAt), 'PPp', { locale: es })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pasos</p>
                  <p className="text-2xl font-bold">{workflow.steps?.length || 0}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ejecuciones</p>
                  <p className="text-2xl font-bold">{workflow.executionCount || 0}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Creado</p>
                  <p className="text-sm font-medium">
                    {format(new Date(workflow.createdAt), 'PP', { locale: es })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}


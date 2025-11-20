'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// import { Switch } from '@/components/ui/switch'; // TODO: Add Switch component
import { 
  Zap,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Pause,
  Eye,
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from @/components/ui/section-header';
import { toast } from 'sonner';
import { workflowsApi, Workflow } from '@/lib/api/crm';

export default function WorkflowsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['workflows', searchQuery, activeFilter],
    queryFn: () => workflowsApi.getAll({
      isActive: activeFilter,
    }),
  });

  const workflows = data?.data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workflowsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow eliminado');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      workflowsApi.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Estado del workflow actualizado');
    },
  });

  return (
    <ErrorBoundary>
      <div>
        <SectionHeader
          title="Automatizaciones"
          description="Crea workflows para automatizar tareas repetitivas"
          actions={
            <Button asChild>
              <TenantLink href="/crm/workflows/new">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Automatización
              </TenantLink>
            </Button>
          }
        />

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar automatizaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Workflows Grid */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={workflows.length === 0}
          onRetry={refetch}
          emptyFallback={
            <div className="text-center py-12">
              <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay automatizaciones</h3>
              <p className="text-muted-foreground mb-4">
                Crea workflows para automatizar tareas y ahorrar tiempo
              </p>
              <Button asChild>
                <TenantLink href="/crm/workflows/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Automatización
                </TenantLink>
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow: Workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{workflow.name}</CardTitle>
                      {workflow.description && (
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <TenantLink href={`/crm/workflows/${workflow.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalle
                          </TenantLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <TenantLink href={`/crm/workflows/${workflow.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </TenantLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            if (confirm('¿Estás seguro de eliminar esta automatización?')) {
                              deleteMutation.mutate(workflow.id);
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Estado</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleActiveMutation.mutate({ id: workflow.id, isActive: !workflow.isActive })
                          }
                        >
                          {workflow.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                          {workflow.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Trigger</span>
                      <Badge variant="outline">{workflow.triggerType}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pasos</span>
                      <span className="text-sm font-medium">
                        {workflow.steps?.length || 0} / {workflow.maxSteps}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ejecuciones</span>
                      <span className="text-sm font-medium">{workflow.executionCount}</span>
                    </div>
                    {workflow.lastExecutedAt && (
                      <div className="text-xs text-muted-foreground">
                        Última ejecución: {new Date(workflow.lastExecutedAt).toLocaleString('es-ES')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </QueryLoading>
      </div>
    </ErrorBoundary>
  );
}


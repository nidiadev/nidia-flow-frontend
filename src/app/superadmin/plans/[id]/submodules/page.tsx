'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/loading';
import { Loader2, ArrowLeft, Check, X, Search, Layers } from 'lucide-react';
import { subModulesApi, SubModule } from '@/lib/api/submodules';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { modulesApi, Module } from '@/lib/api/modules';

export default function PlanSubModulesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const planId = params.id as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Fetch plan
  const { data: plan, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['plans', planId],
    queryFn: () => plansApi.get(planId),
    enabled: !!planId,
  });

  // Fetch all modules
  const { data: allModules, isLoading: isLoadingModules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => modulesApi.list(true),
  });

  // Fetch all submodules with plan status
  const { data: allSubModulesWithStatus, isLoading: isLoadingSubModules } = useQuery({
    queryKey: ['submodules', 'with-plan-status'],
    queryFn: () => subModulesApi.getWithPlanStatus(),
  });

  // Assign/remove mutation
  const assignMutation = useMutation({
    mutationFn: ({ subModuleId, isEnabled }: { subModuleId: string; isEnabled: boolean }) =>
      subModulesApi.assignToPlan({
        subModuleId,
        planId,
        isEnabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submodules', 'with-plan-status'] });
      queryClient.invalidateQueries({ queryKey: ['submodules'] });
      toast.success('Submódulo asignado al plan');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al asignar submódulo');
    },
  });

  const handleToggle = async (subModuleId: string, currentStatus: boolean) => {
    await assignMutation.mutateAsync({
      subModuleId,
      isEnabled: !currentStatus,
    });
  };

  if (isLoadingPlan || isLoadingModules || isLoadingSubModules) {
    return (
      <div className="container mx-auto py-8">
        <TableSkeleton rows={5} columns={4} />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="Plan no encontrado"
          description="El plan solicitado no existe"
          variant="default"
          showBack
        />
      </div>
    );
  }

  // Group submodules by module
  const subModulesByModule = new Map<string, SubModule[]>();
  (allSubModulesWithStatus || []).forEach((subModule: any) => {
    const moduleId = subModule.moduleId || 'unknown';
    if (!subModulesByModule.has(moduleId)) {
      subModulesByModule.set(moduleId, []);
    }
    subModulesByModule.get(moduleId)!.push(subModule);
  });

  // Get plan status for submodules
  const getSubModulePlanStatus = (subModuleId: string): boolean => {
    const subModule = (allSubModulesWithStatus || []).find((sm: any) => sm.id === subModuleId);
    return subModule?.planStatus?.find((ps: any) => ps.planId === planId)?.isEnabled || false;
  };

  const filteredSubModules = selectedModuleId
    ? (subModulesByModule.get(selectedModuleId) || []).filter((subModule) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          subModule.name.toLowerCase().includes(query) ||
          subModule.displayName.toLowerCase().includes(query) ||
          subModule.path?.toLowerCase().includes(query)
        );
      })
    : [];

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title={`Submódulos del Plan: ${plan.displayName}`}
        description="Gestiona qué submódulos están disponibles en este plan"
        variant="default"
        showBack
        onBack={() => router.push(`/superadmin/plans/${planId}`)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Submódulos Disponibles</CardTitle>
          <CardDescription>
            Activa o desactiva submódulos para este plan de suscripción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-4">
            {/* Module Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Filtrar por Módulo</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedModuleId === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModuleId(null)}
                >
                  Todos
                </Button>
                {(allModules || []).map((module) => (
                  <Button
                    key={module.id}
                    variant={selectedModuleId === module.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedModuleId(module.id)}
                  >
                    {module.displayName}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar submódulos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {!selectedModuleId ? (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecciona un módulo para ver sus submódulos</p>
            </div>
          ) : filteredSubModules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron submódulos
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submódulo</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubModules.map((subModule) => {
                  const isEnabled = getSubModulePlanStatus(subModule.id);
                  return (
                    <TableRow key={subModule.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {subModule.icon && (
                            <span className="text-muted-foreground">{subModule.icon}</span>
                          )}
                          <span>{subModule.displayName}</span>
                        </div>
                        {subModule.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {subModule.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {subModule.path ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {subModule.path}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {subModule.permissions && subModule.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {subModule.permissions.slice(0, 2).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                            {subModule.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{subModule.permissions.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isEnabled ? 'default' : 'secondary'}
                          className={cn(isEnabled && 'bg-green-500 hover:bg-green-600')}
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
                            onCheckedChange={() => handleToggle(subModule.id, isEnabled)}
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


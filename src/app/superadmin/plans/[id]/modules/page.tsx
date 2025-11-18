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
import { Loader2, ArrowLeft, Check, X, Search } from 'lucide-react';
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

export default function PlanModulesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const planId = params.id as string;
  const [searchQuery, setSearchQuery] = useState('');

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

  // Fetch modules for this plan
  const { data: planModules } = useQuery({
    queryKey: ['modules', 'plan', planId],
    queryFn: () => modulesApi.getModulesForPlan(planId),
    enabled: !!planId,
  });

  // Assign/remove mutation
  const assignMutation = useMutation({
    mutationFn: ({ moduleId, isEnabled }: { moduleId: string; isEnabled: boolean }) =>
      modulesApi.assignToPlan({
        moduleId,
        planId,
        isEnabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', 'plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Módulo asignado al plan');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al asignar módulo');
    },
  });

  const handleToggle = async (moduleId: string, currentStatus: boolean) => {
    await assignMutation.mutateAsync({
      moduleId,
      isEnabled: !currentStatus,
    });
  };

  if (isLoadingPlan || isLoadingModules) {
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

  const enabledModuleIds = new Set((planModules || []).map((m) => m.id));

  const filteredModules = (allModules || []).filter((module) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.name.toLowerCase().includes(query) ||
      module.displayName.toLowerCase().includes(query) ||
      module.path.toLowerCase().includes(query) ||
      module.category?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title={`Módulos del Plan: ${plan.displayName}`}
        description="Gestiona qué módulos están disponibles en este plan"
        variant="default"
        showBack
        onBack={() => router.push('/superadmin/plans')}
      />

      <Card>
        <CardHeader>
          <CardTitle>Módulos Disponibles</CardTitle>
          <CardDescription>
            Activa o desactiva módulos para este plan de suscripción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar módulos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredModules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron módulos
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModules.map((module) => {
                  const isEnabled = enabledModuleIds.has(module.id);
                  return (
                    <TableRow key={module.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {module.icon && (
                            <span className="text-muted-foreground">{module.icon}</span>
                          )}
                          <span>{module.displayName}</span>
                        </div>
                        {module.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {module.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {module.path}
                        </code>
                      </TableCell>
                      <TableCell>
                        {module.category && (
                          <Badge variant="outline">{module.category}</Badge>
                        )}
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
                            onCheckedChange={() => handleToggle(module.id, isEnabled)}
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


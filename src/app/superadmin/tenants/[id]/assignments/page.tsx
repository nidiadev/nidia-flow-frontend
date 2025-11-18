'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/components/ui/loading';
import {
  Loader2,
  ArrowLeft,
  Check,
  X,
  Search,
  Layers,
  Package,
  Calendar,
  Plus,
  Trash2,
} from 'lucide-react';
import { tenantAssignmentsApi } from '@/lib/api/tenant-assignments';
import { modulesApi, Module } from '@/lib/api/modules';
import { subModulesApi, SubModule } from '@/lib/api/submodules';
import { tenantsApi } from '@/lib/api/tenants';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TenantAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tenantId = params.id as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'modules' | 'submodules'>('modules');
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isSubModuleDialogOpen, setIsSubModuleDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedSubModule, setSelectedSubModule] = useState<SubModule | null>(null);

  // Form states
  const [assignmentData, setAssignmentData] = useState({
    isEnabled: true,
    startsAt: '',
    endsAt: '',
    reason: '',
  });

  // Fetch tenant
  const { data: tenant, isLoading: isLoadingTenant } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => tenantsApi.getById(tenantId),
    enabled: !!tenantId,
  });

  // Fetch all modules
  const { data: allModules, isLoading: isLoadingModules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => modulesApi.list(true),
  });

  // Fetch all submodules
  const { data: allSubModules, isLoading: isLoadingSubModules } = useQuery({
    queryKey: ['submodules'],
    queryFn: () => subModulesApi.list(undefined, true),
  });

  // Fetch tenant module assignments
  const { data: tenantModuleAssignments, isLoading: isLoadingModuleAssignments } = useQuery({
    queryKey: ['tenant-assignments', 'modules', tenantId],
    queryFn: () => tenantAssignmentsApi.getTenantModuleAssignments(tenantId),
    enabled: !!tenantId,
  });

  // Fetch tenant submodule assignments
  const { data: tenantSubModuleAssignments, isLoading: isLoadingSubModuleAssignments } = useQuery({
    queryKey: ['tenant-assignments', 'submodules', tenantId],
    queryFn: () => tenantAssignmentsApi.getTenantSubModuleAssignments(tenantId),
    enabled: !!tenantId,
  });

  // Assign module mutation
  const assignModuleMutation = useMutation({
    mutationFn: tenantAssignmentsApi.assignModuleToTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-assignments', 'modules', tenantId] });
      setIsModuleDialogOpen(false);
      setSelectedModule(null);
      setAssignmentData({ isEnabled: true, startsAt: '', endsAt: '', reason: '' });
      toast.success('Módulo asignado al cliente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al asignar módulo');
    },
  });

  // Remove module mutation
  const removeModuleMutation = useMutation({
    mutationFn: ({ moduleId }: { moduleId: string }) =>
      tenantAssignmentsApi.removeModuleFromTenant(moduleId, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-assignments', 'modules', tenantId] });
      toast.success('Módulo removido del cliente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al remover módulo');
    },
  });

  // Assign submodule mutation
  const assignSubModuleMutation = useMutation({
    mutationFn: tenantAssignmentsApi.assignSubModuleToTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-assignments', 'submodules', tenantId] });
      setIsSubModuleDialogOpen(false);
      setSelectedSubModule(null);
      setAssignmentData({ isEnabled: true, startsAt: '', endsAt: '', reason: '' });
      toast.success('Submódulo asignado al cliente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al asignar submódulo');
    },
  });

  // Remove submodule mutation
  const removeSubModuleMutation = useMutation({
    mutationFn: ({ subModuleId }: { subModuleId: string }) =>
      tenantAssignmentsApi.removeSubModuleFromTenant(subModuleId, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-assignments', 'submodules', tenantId] });
      toast.success('Submódulo removido del cliente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al remover submódulo');
    },
  });

  const handleAssignModule = () => {
    if (!selectedModule) return;
    assignModuleMutation.mutateAsync({
      moduleId: selectedModule.id,
      tenantId,
      ...assignmentData,
      startsAt: assignmentData.startsAt || undefined,
      endsAt: assignmentData.endsAt || undefined,
      reason: assignmentData.reason || undefined,
    });
  };

  const handleAssignSubModule = () => {
    if (!selectedSubModule) return;
    assignSubModuleMutation.mutateAsync({
      subModuleId: selectedSubModule.id,
      tenantId,
      ...assignmentData,
      startsAt: assignmentData.startsAt || undefined,
      endsAt: assignmentData.endsAt || undefined,
      reason: assignmentData.reason || undefined,
    });
  };

  const handleRemoveModule = (moduleId: string) => {
    if (confirm('¿Estás seguro de remover este módulo del cliente?')) {
      removeModuleMutation.mutateAsync({ moduleId });
    }
  };

  const handleRemoveSubModule = (subModuleId: string) => {
    if (confirm('¿Estás seguro de remover este submódulo del cliente?')) {
      removeSubModuleMutation.mutateAsync({ subModuleId });
    }
  };

  const getModuleAssignment = (moduleId: string) => {
    return tenantModuleAssignments?.find((a) => a.moduleId === moduleId);
  };

  const getSubModuleAssignment = (subModuleId: string) => {
    return tenantSubModuleAssignments?.find((a) => a.subModuleId === subModuleId);
  };

  const filteredModules = (allModules || []).filter((module) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.name.toLowerCase().includes(query) ||
      module.displayName.toLowerCase().includes(query) ||
      module.path.toLowerCase().includes(query)
    );
  });

  const filteredSubModules = (allSubModules || []).filter((subModule) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      subModule.name.toLowerCase().includes(query) ||
      subModule.displayName.toLowerCase().includes(query) ||
      subModule.path?.toLowerCase().includes(query)
    );
  });

  if (isLoadingTenant || isLoadingModules || isLoadingSubModules) {
    return (
      <div className="container mx-auto py-8">
        <TableSkeleton rows={5} columns={4} />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="container mx-auto py-8">
        <PageHeader
          title="Cliente no encontrado"
          description="El cliente solicitado no existe"
          variant="default"
          showBack
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title={`Asignaciones Directas - ${tenant.name}`}
        description="Gestiona módulos y submódulos asignados directamente a este cliente (independiente del plan)"
        variant="default"
        showBack
        onBack={() => router.push(`/superadmin/tenants/${tenantId}`)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Asignaciones Directas</CardTitle>
          <CardDescription>
            Las asignaciones directas tienen prioridad sobre las asignaciones del plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'modules' | 'submodules')}>
            <TabsList className="mb-4">
              <TabsTrigger value="modules">
                <Package className="h-4 w-4 mr-2" />
                Módulos
              </TabsTrigger>
              <TabsTrigger value="submodules">
                <Layers className="h-4 w-4 mr-2" />
                Submódulos
              </TabsTrigger>
            </TabsList>

            {/* Modules Tab */}
            <TabsContent value="modules" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar módulos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => {
                    setSelectedModule(null);
                    setAssignmentData({ isEnabled: true, startsAt: '', endsAt: '', reason: '' });
                    setIsModuleDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Asignar Módulo
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Razón</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModules.map((module) => {
                    const assignment = getModuleAssignment(module.id);
                    const isAssigned = !!assignment;
                    const isEnabled = assignment?.isEnabled ?? false;

                    return (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {module.icon && (
                              <span className="text-muted-foreground">{module.icon}</span>
                            )}
                            <span>{module.displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isAssigned ? (
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
                          ) : (
                            <Badge variant="outline">No asignado</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignment?.startsAt
                            ? format(new Date(assignment.startsAt), 'dd/MM/yyyy', { locale: es })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {assignment?.endsAt
                            ? format(new Date(assignment.endsAt), 'dd/MM/yyyy', { locale: es })
                            : assignment?.startsAt
                              ? 'Permanente'
                              : '-'}
                        </TableCell>
                        <TableCell>
                          {assignment?.reason ? (
                            <span className="text-sm text-muted-foreground">{assignment.reason}</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isAssigned ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveModule(module.id)}
                              disabled={removeModuleMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedModule(module);
                                setAssignmentData({ isEnabled: true, startsAt: '', endsAt: '', reason: '' });
                                setIsModuleDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            {/* SubModules Tab */}
            <TabsContent value="submodules" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar submódulos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => {
                    setSelectedSubModule(null);
                    setAssignmentData({ isEnabled: true, startsAt: '', endsAt: '', reason: '' });
                    setIsSubModuleDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Asignar Submódulo
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submódulo</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead>Razón</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubModules.map((subModule) => {
                    const assignment = getSubModuleAssignment(subModule.id);
                    const isAssigned = !!assignment;
                    const isEnabled = assignment?.isEnabled ?? false;

                    return (
                      <TableRow key={subModule.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {subModule.icon && (
                              <span className="text-muted-foreground">{subModule.icon}</span>
                            )}
                            <span>{subModule.displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {subModule.module ? (
                            <Badge variant="outline">{subModule.module.displayName}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {isAssigned ? (
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
                          ) : (
                            <Badge variant="outline">No asignado</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignment?.startsAt
                            ? format(new Date(assignment.startsAt), 'dd/MM/yyyy', { locale: es })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {assignment?.endsAt
                            ? format(new Date(assignment.endsAt), 'dd/MM/yyyy', { locale: es })
                            : assignment?.startsAt
                              ? 'Permanente'
                              : '-'}
                        </TableCell>
                        <TableCell>
                          {assignment?.reason ? (
                            <span className="text-sm text-muted-foreground">{assignment.reason}</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isAssigned ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveSubModule(subModule.id)}
                              disabled={removeSubModuleMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSubModule(subModule);
                                setAssignmentData({ isEnabled: true, startsAt: '', endsAt: '', reason: '' });
                                setIsSubModuleDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Assign Module Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asignar Módulo al Cliente</DialogTitle>
            <DialogDescription>
              {selectedModule
                ? `Asignar "${selectedModule.displayName}" a ${tenant.name}`
                : 'Selecciona un módulo para asignar'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!selectedModule ? (
              <div className="space-y-2">
                <Label>Módulo</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  onChange={(e) => {
                    const module = allModules?.find((m) => m.id === e.target.value);
                    setSelectedModule(module || null);
                  }}
                >
                  <option value="">Seleccionar módulo...</option>
                  {allModules?.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.displayName}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{selectedModule.displayName}</p>
                  {selectedModule.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedModule.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de Inicio (opcional)</Label>
                    <Input
                      type="date"
                      value={assignmentData.startsAt}
                      onChange={(e) =>
                        setAssignmentData({ ...assignmentData, startsAt: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Fin (opcional)</Label>
                    <Input
                      type="date"
                      value={assignmentData.endsAt}
                      onChange={(e) =>
                        setAssignmentData({ ...assignmentData, endsAt: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Razón de la Asignación (opcional)</Label>
                  <Textarea
                    placeholder="Ej: Promoción especial, Prueba gratuita, etc."
                    value={assignmentData.reason}
                    onChange={(e) =>
                      setAssignmentData({ ...assignmentData, reason: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={assignmentData.isEnabled}
                    onCheckedChange={(checked) =>
                      setAssignmentData({ ...assignmentData, isEnabled: checked })
                    }
                  />
                  <Label htmlFor="enabled">Habilitado</Label>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignModule}
              disabled={!selectedModule || assignModuleMutation.isPending}
            >
              {assignModuleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Asignar Módulo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign SubModule Dialog */}
      <Dialog open={isSubModuleDialogOpen} onOpenChange={setIsSubModuleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asignar Submódulo al Cliente</DialogTitle>
            <DialogDescription>
              {selectedSubModule
                ? `Asignar "${selectedSubModule.displayName}" a ${tenant.name}`
                : 'Selecciona un submódulo para asignar'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!selectedSubModule ? (
              <div className="space-y-2">
                <Label>Submódulo</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  onChange={(e) => {
                    const subModule = allSubModules?.find((sm) => sm.id === e.target.value);
                    setSelectedSubModule(subModule || null);
                  }}
                >
                  <option value="">Seleccionar submódulo...</option>
                  {allSubModules?.map((subModule) => (
                    <option key={subModule.id} value={subModule.id}>
                      {subModule.displayName}
                      {subModule.module ? ` (${subModule.module.displayName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{selectedSubModule.displayName}</p>
                  {selectedSubModule.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedSubModule.description}
                    </p>
                  )}
                  {selectedSubModule.module && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Módulo: {selectedSubModule.module.displayName}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de Inicio (opcional)</Label>
                    <Input
                      type="date"
                      value={assignmentData.startsAt}
                      onChange={(e) =>
                        setAssignmentData({ ...assignmentData, startsAt: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Fin (opcional)</Label>
                    <Input
                      type="date"
                      value={assignmentData.endsAt}
                      onChange={(e) =>
                        setAssignmentData({ ...assignmentData, endsAt: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Razón de la Asignación (opcional)</Label>
                  <Textarea
                    placeholder="Ej: Promoción especial, Prueba gratuita, etc."
                    value={assignmentData.reason}
                    onChange={(e) =>
                      setAssignmentData({ ...assignmentData, reason: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled-submodule"
                    checked={assignmentData.isEnabled}
                    onCheckedChange={(checked) =>
                      setAssignmentData({ ...assignmentData, isEnabled: checked })
                    }
                  />
                  <Label htmlFor="enabled-submodule">Habilitado</Label>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubModuleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignSubModule}
              disabled={!selectedSubModule || assignSubModuleMutation.isPending}
            >
              {assignSubModuleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Asignar Submódulo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


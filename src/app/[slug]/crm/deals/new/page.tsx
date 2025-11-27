'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
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
import { Combobox } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Tooltip, TooltipContent, TooltipProviderImmediate, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Save, Plus, HelpCircle, DollarSign, Calendar, User, Target, Percent, Building2, Info, Lightbulb, X } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { CreateDealDto } from '@/lib/api/crm';
import { useCustomers, useCreateCustomer, useDealStages, useCreateDeal } from '@/hooks/use-api';
import { ApiClient } from '@/lib/api';
import { dealStagesApi } from '@/lib/api/crm';

const createDealSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres'),
  customerId: z.string().uuid('Cliente inválido'),
  stageId: z.string().uuid('Etapa inválida'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  currency: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
});

type CreateDealForm = z.infer<typeof createDealSchema>;

export default function NewDealPage() {
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);

  const { data: customersData, refetch: refetchCustomers } = useCustomers({ limit: 100 });
  const customers = customersData || [];
  const createCustomer = useCreateCustomer();

  const { data: stagesData, isLoading: stagesLoading, isError: stagesError, error: stagesErrorObj, refetch: refetchStages } = useDealStages();
  
  // Debug: Log stages data
  useEffect(() => {
    if (stagesData) {
      console.log('Stages data:', stagesData);
    }
    if (stagesError) {
      console.error('Stages error:', stagesErrorObj);
    }
  }, [stagesData, stagesError, stagesErrorObj]);
  
  const stages = Array.isArray(stagesData) ? stagesData : [];

  const createDeal = useCreateDeal();

  // Fetch users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await ApiClient.get('/users', { params: { isActive: true, limit: 100 } });
        setUsers(response.data?.data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateDealForm>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      currency: 'COP',
      probability: 50,
      assignedTo: null,
    },
  });

  // Initialize stages if none exist
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasTriedAutoInit, setHasTriedAutoInit] = useState(false);
  
  const handleInitializeStages = async () => {
    setIsInitializing(true);
    try {
      const response = await dealStagesApi.initialize();
      console.log('[handleInitializeStages] Initialize response:', response);
      toast.success('Etapas inicializadas correctamente');
      await refetchStages();
      setHasTriedAutoInit(true);
    } catch (error: any) {
      console.error('[handleInitializeStages] Error:', error);
      toast.error(error?.response?.data?.message || 'Error al inicializar las etapas');
    } finally {
      setIsInitializing(false);
    }
  };

  // Auto-initialize stages if none exist (only once)
  useEffect(() => {
    if (!stagesLoading && !stagesError && stages.length === 0 && !isInitializing && !hasTriedAutoInit) {
      // Auto-initialize stages if none exist (only try once)
      setHasTriedAutoInit(true);
      handleInitializeStages();
    }
  }, [stagesLoading, stagesError, stages.length, isInitializing, hasTriedAutoInit]);

  // Set default stage when stages are loaded
  useEffect(() => {
    if (stages.length > 0 && !watch('stageId')) {
      const defaultStage = stages
        .filter((s: any) => s.isActive)
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)[0];
      if (defaultStage) {
        setValue('stageId', defaultStage.id);
        setValue('probability', defaultStage.probability);
      }
    }
  }, [stages, setValue, watch]);

  const selectedStageId = watch('stageId');
  const selectedStage = stages.find((s: any) => s.id === selectedStageId);
  const amount = watch('amount') || 0;
  const probability = watch('probability') || 0;
  const weightedValue = (amount * probability) / 100;

  // Auto-set probability based on stage
  useEffect(() => {
  if (selectedStage && watch('probability') !== selectedStage.probability) {
      setValue('probability', selectedStage.probability, { shouldValidate: false });
    }
  }, [selectedStage, setValue, watch]);

  const onSubmit = async (data: CreateDealForm) => {
    try {
      const dealData: CreateDealDto = {
        ...data,
        probability: data.probability || selectedStage?.probability || 50,
        assignedTo: data.assignedTo || undefined,
      };
      
      const response = await createDeal.mutateAsync(dealData);
      toast.success('Deal creado exitosamente');
      
      // Invalidate queries to refresh pipeline (useCreateDeal already does this, but we ensure it)
      await queryClient.invalidateQueries({ queryKey: ['crm', 'deals'] });
      
      // response is ApiResponse<DealResponseDto>, so we need response.data.id
      const dealId = (response as any).data?.id;
      if (dealId) {
        router.push(route(`/crm/deals/${dealId}`));
      } else {
        // If no ID, redirect to pipeline
        router.push(route('/crm/pipeline'));
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al crear el deal');
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerEmail.trim()) {
      toast.error('Nombre y email son requeridos');
      return;
    }

    try {
      const [firstName, ...lastNameParts] = newCustomerName.trim().split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      const newCustomer = await createCustomer.mutateAsync({
        firstName: firstName || newCustomerName,
        lastName: lastName || firstName,
        email: newCustomerEmail.trim(),
        whatsapp: '+573000000000',
        companyName: firstName || newCustomerName,
        type: 'lead',
        leadSource: 'other',
        leadScore: 50,
        addressLine1: 'Por definir',
        city: 'Bogotá',
        country: 'CO',
        industry: 'Otro',
        segment: 'B2B',
        taxId: '000000000-0',
      });

      toast.success('Cliente creado exitosamente');
      setShowCreateCustomerDialog(false);
      setNewCustomerName('');
      setNewCustomerEmail('');
      
      await refetchCustomers();
      if ((newCustomer as any)?.data?.id || (newCustomer as any)?.id) {
        const customerId = (newCustomer as any)?.data?.id || (newCustomer as any)?.id;
        setValue('customerId', customerId);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al crear el cliente');
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Nuevo Deal"
          description="Crea una nueva oportunidad en el pipeline"
          actions={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelpDrawer(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Ayuda
              </Button>
            <Button variant="outline" asChild>
                <TenantLink href={route('/crm/pipeline')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </TenantLink>
            </Button>
            </>
          }
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Información Básica</CardTitle>
                  <CardDescription>
                    Completa los datos principales del deal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Nombre del Deal y Cliente - Una sola fila */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre del Deal */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Nombre del Deal *
                        </Label>
                        <TooltipProviderImmediate>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center justify-center cursor-help">
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-nidia-green transition-colors" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" sideOffset={8} className="max-w-xs">
                              <p className="text-xs">
                                Ingresa un nombre descriptivo que identifique claramente esta oportunidad. 
                                Ejemplo: "Implementación CRM - Empresa XYZ" o "Renovación contrato anual - Cliente ABC"
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProviderImmediate>
                      </div>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Ej: Implementación CRM - Empresa XYZ"
                        className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                        <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                    )}
                  </div>

                    {/* Cliente */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="customerId" className="text-sm font-medium">
                          Cliente *
                        </Label>
                        <TooltipProviderImmediate>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center justify-center cursor-help">
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-nidia-green transition-colors" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" sideOffset={8} className="max-w-xs">
                              <p className="text-xs">
                                Busca y selecciona el cliente asociado a esta oportunidad. Si el cliente no existe, 
                                puedes crearlo rápidamente usando el botón "Nuevo Cliente".
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProviderImmediate>
                    </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Combobox
                            options={customers.map((customer: any) => {
                          const displayName = customer.companyName || 
                            `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
                            customer.email ||
                            'Cliente sin nombre';
                              return {
                                value: customer.id,
                                label: displayName,
                              };
                            })}
                            value={watch('customerId') || ''}
                            onValueChange={(value) => setValue('customerId', value)}
                            placeholder="Buscar o seleccionar cliente..."
                            searchPlaceholder="Buscar cliente por nombre, empresa o email..."
                            emptyText="No se encontraron clientes"
                            allowCustom={false}
                            className={errors.customerId ? 'border-destructive' : ''}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateCustomerDialog(true)}
                          className="h-9 px-3 flex-shrink-0"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Nuevo
                        </Button>
                      </div>
                    {errors.customerId && (
                        <p className="text-xs text-destructive mt-1">{errors.customerId.message}</p>
                    )}
                    </div>
                  </div>

                  {/* Etapa y Probabilidad */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="stageId" className="text-sm font-medium">
                          Etapa *
                        </Label>
                        <TooltipProviderImmediate>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center justify-center cursor-help">
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-nidia-green transition-colors" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" sideOffset={8} className="max-w-xs">
                              <p className="text-xs">
                                Selecciona la etapa del pipeline en la que se encuentra esta oportunidad. 
                                La probabilidad se ajustará automáticamente según la etapa seleccionada, 
                                pero puedes modificarla manualmente si es necesario.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProviderImmediate>
                      </div>
                      <div className="space-y-2">
                        <Select
                          value={watch('stageId') || ''}
                          onValueChange={(value) => {
                            setValue('stageId', value);
                            const stage = stages.find((s: any) => s.id === value);
                            if (stage) {
                              setValue('probability', stage.probability);
                            }
                          }}
                          disabled={stagesLoading || stages.length === 0}
                        >
                          <SelectTrigger className={errors.stageId ? 'border-destructive' : ''}>
                            <SelectValue 
                              placeholder={
                                stagesLoading 
                                  ? "Cargando etapas..." 
                                  : stagesError
                                  ? "Error al cargar etapas"
                                  : stages.length === 0 
                                  ? "No hay etapas disponibles" 
                                  : "Selecciona una etapa"
                              } 
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {stagesLoading ? (
                              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                Cargando etapas...
                              </div>
                            ) : stagesError ? (
                              <div className="px-2 py-6 text-center space-y-3">
                                <div className="text-sm text-destructive">
                                  <p className="mb-2">Error al cargar las etapas</p>
                                  <p className="text-xs mb-3 text-muted-foreground">
                                    {(stagesErrorObj as any)?.response?.data?.message || 'Error desconocido'}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => refetchStages()}
                                  className="w-full"
                                >
                                  Reintentar
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleInitializeStages}
                                  disabled={isInitializing}
                                  className="w-full"
                                >
                                  {isInitializing ? 'Inicializando...' : 'Inicializar Etapas'}
                                </Button>
                              </div>
                            ) : stages.length === 0 ? (
                              <div className="px-2 py-6 text-center space-y-3">
                                <div className="text-sm text-muted-foreground">
                                  <p className="mb-2">No hay etapas configuradas</p>
                                  <p className="text-xs mb-3">Inicializa las etapas por defecto del pipeline</p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleInitializeStages}
                                  disabled={isInitializing}
                                  className="w-full"
                                >
                                  {isInitializing ? 'Inicializando...' : 'Inicializar Etapas'}
                                </Button>
                              </div>
                            ) : (
                              stages
                                .filter((s: any) => s.isActive)
                                .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                                .map((stage: any) => (
                                  <SelectItem key={stage.id} value={stage.id}>
                                    <div className="flex items-center gap-2">
                                      {stage.color && (
                                        <div 
                                          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                                          style={{ backgroundColor: stage.color }}
                                        />
                                      )}
                                      <span>{stage.displayName}</span>
                                      <span className="text-muted-foreground ml-auto">({stage.probability}%)</span>
                                    </div>
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                        {stagesError && (
                          <p className="text-xs text-destructive">
                            Error: {(stagesErrorObj as any)?.response?.data?.message || 'Error al cargar las etapas'}
                          </p>
                        )}
                      </div>
                      {errors.stageId && (
                        <p className="text-xs text-destructive mt-1">{errors.stageId.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="probability" className="text-sm font-medium">
                          Probabilidad (%)
                        </Label>
                        <TooltipProviderImmediate>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center justify-center cursor-help">
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-nidia-green transition-colors" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" sideOffset={8} className="max-w-xs">
                              <p className="text-xs">
                                La probabilidad de cierre de esta oportunidad (0-100%). 
                                Este valor se usa para calcular el valor ponderado del deal. 
                                Se ajusta automáticamente según la etapa seleccionada.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProviderImmediate>
                      </div>
                      <div className="relative">
                      <Input
                        id="probability"
                        type="number"
                        min="0"
                        max="100"
                        {...register('probability', { valueAsNumber: true })}
                          className={errors.probability ? 'border-destructive' : ''}
                      />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                      {errors.probability && (
                        <p className="text-xs text-destructive mt-1">{errors.probability.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Monto y Moneda */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="amount" className="text-sm font-medium">
                          Monto *
                        </Label>
                        <TooltipProviderImmediate>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center justify-center cursor-help">
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-nidia-green transition-colors" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" sideOffset={8} className="max-w-xs">
                              <p className="text-xs">
                                El valor total de la oportunidad. Este monto se multiplicará por la probabilidad 
                                para calcular el valor ponderado, que es útil para el forecasting y análisis del pipeline.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProviderImmediate>
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register('amount', { valueAsNumber: true })}
                        placeholder="0.00"
                          className={`pl-9 ${errors.amount ? 'border-destructive' : ''}`}
                      />
                      </div>
                      {errors.amount && (
                        <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="currency" className="text-sm font-medium">
                          Moneda
                        </Label>
                        <TooltipProviderImmediate>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center justify-center cursor-help">
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-nidia-green transition-colors" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" sideOffset={8} className="max-w-xs">
                              <p className="text-xs">
                                Selecciona la moneda en la que se expresará el monto del deal. 
                                Esto es importante para reportes y análisis financieros.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProviderImmediate>
                      </div>
                      <Select
                        value={watch('currency') || 'COP'}
                        onValueChange={(value) => setValue('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                          <SelectItem value="USD">USD - Dólar</SelectItem>
                          <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                          <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                          <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                          <SelectItem value="BRL">BRL - Real Brasileño</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Fecha de Cierre y Asignado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="expectedCloseDate" className="text-sm font-medium">
                          Fecha de Cierre Esperada
                        </Label>
                        <TooltipProviderImmediate>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center justify-center cursor-help">
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-nidia-green transition-colors" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" sideOffset={8} className="max-w-xs">
                              <p className="text-xs">
                                La fecha estimada en la que esperas cerrar esta oportunidad. 
                                Útil para forecasting y seguimiento del pipeline.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProviderImmediate>
                      </div>
                      <div className="relative">
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="expectedCloseDate"
                        type="date"
                        {...register('expectedCloseDate')}
                          className="pr-10"
                      />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="assignedTo" className="text-sm font-medium">
                          Asignado a
                        </Label>
                        <TooltipProviderImmediate>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center justify-center cursor-help">
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-nidia-green transition-colors" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" sideOffset={8} className="max-w-xs">
                              <p className="text-xs">
                                Asigna esta oportunidad a un miembro del equipo. 
                                Si no se asigna, el deal quedará disponible para todos.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProviderImmediate>
                      </div>
                      <Select
                        value={watch('assignedTo') || 'none'}
                        onValueChange={(value) => {
                          setValue('assignedTo', value === 'none' ? null : value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{user.firstName} {user.lastName}</span>
                                {user.email && (
                                  <span className="text-muted-foreground text-xs ml-auto">
                                    ({user.email})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="notes" className="text-sm font-medium">
                        Notas
                      </Label>
                      <TooltipProviderImmediate>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center justify-center cursor-help">
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-nidia-green transition-colors" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" sideOffset={8} className="max-w-xs">
                            <p className="text-xs">
                              Información adicional sobre esta oportunidad: contexto, requerimientos especiales, 
                              puntos clave de la negociación, etc. Esta información será visible para todo el equipo.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProviderImmediate>
                    </div>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Notas adicionales sobre el deal..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Resumen */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Resumen</CardTitle>
                  <CardDescription className="text-xs">
                    Resumen de la oportunidad
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Valor del Deal</p>
                    <p className="text-3xl font-bold text-foreground">
                      ${amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">{watch('currency') || 'COP'}</p>
                  </div>
                  
                  <div className="space-y-1 pt-3 border-t">
                    <p className="text-xs text-muted-foreground font-medium">Valor Ponderado</p>
                    <p className="text-2xl font-semibold text-nidia-green">
                      ${weightedValue.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {probability}% de probabilidad
                    </p>
                  </div>

                  {selectedStage && (
                    <div className="space-y-2 pt-3 border-t">
                      <p className="text-xs text-muted-foreground font-medium">Etapa Seleccionada</p>
                      <div className="flex items-center gap-2">
                        {selectedStage.color && (
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: selectedStage.color }}
                          />
                        )}
                        <span className="font-medium text-sm">{selectedStage.displayName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Probabilidad: {selectedStage.probability}%
                      </p>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting || createDeal.isPending}
                      size="lg"
                    >
                      {isSubmitting || createDeal.isPending ? (
                        <>
                          <Save className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Crear Deal
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>

        {/* Create Customer Dialog */}
        <Dialog open={showCreateCustomerDialog} onOpenChange={setShowCreateCustomerDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Crea un cliente rápidamente para asociarlo a este deal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newCustomerName" className="text-sm font-medium">
                  Nombre Completo *
                </Label>
                <Input
                  id="newCustomerName"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Ej: Juan Pérez o Empresa XYZ"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCustomer();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newCustomerEmail" className="text-sm font-medium">
                  Email *
                </Label>
                <Input
                  id="newCustomerEmail"
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCustomer();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateCustomerDialog(false);
                  setNewCustomerName('');
                  setNewCustomerEmail('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCustomer}
                disabled={createCustomer.isPending || !newCustomerName.trim() || !newCustomerEmail.trim()}
              >
                {createCustomer.isPending ? 'Creando...' : 'Crear Cliente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Help Drawer */}
        <Drawer open={showHelpDrawer} onOpenChange={setShowHelpDrawer} direction="right">
          <DrawerContent direction="right" className="h-full max-w-md">
            <DrawerHeader className="text-left border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-nidia-green/10 dark:bg-nidia-green/20">
                  <Lightbulb className="h-5 w-5 text-nidia-green" />
                </div>
                <div>
                  <DrawerTitle className="text-lg font-semibold">¿Qué es un Deal?</DrawerTitle>
                  <DrawerDescription className="text-xs mt-1">
                    Información sobre oportunidades de venta
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-foreground leading-relaxed mb-3">
                    Un <strong className="text-nidia-green">Deal</strong> es una oportunidad de venta que estás siguiendo con un cliente. 
                    Representa un potencial negocio que puede convertirse en ingresos para tu empresa.
                  </p>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-foreground leading-relaxed">
                      <strong className="text-blue-600">¿Para qué sectores aplica?</strong> Los deals son universales y aplican para 
                      <strong> cualquier sector empresarial</strong>. Ya sea que vendas productos, servicios, software, consultoría, 
                      bienes raíces, manufactura, retail, o cualquier otro tipo de negocio, el sistema de deals te ayuda a gestionar 
                      tus oportunidades de venta de manera efectiva.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Etapas del Pipeline</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Los deals avanzan por diferentes etapas (Calificación, Propuesta, Negociación, etc.) según su progreso. 
                        Selecciona la etapa que mejor refleje el estado actual de esta oportunidad.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-green-500/10 flex-shrink-0">
                      <Percent className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Probabilidad</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Indica qué tan probable es que cierres este deal (0-100%). Este valor se ajusta automáticamente 
                        según la etapa seleccionada, pero puedes modificarlo manualmente si es necesario.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Valor Ponderado</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Es el monto multiplicado por la probabilidad. Te ayuda a hacer forecasting más preciso de tus ingresos. 
                        Por ejemplo: un deal de $100,000 con 50% de probabilidad tiene un valor ponderado de $50,000.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-yellow-500/10 flex-shrink-0">
                      <Calendar className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Fecha de Cierre Esperada</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        La fecha estimada en la que esperas cerrar esta oportunidad. Útil para forecasting y seguimiento 
                        del pipeline. Puedes actualizarla a medida que la negociación avanza.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Tip:</strong> Completa todos los campos requeridos para tener un deal bien documentado. 
                    El valor ponderado se calcula automáticamente en el resumen.
                  </p>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </ErrorBoundary>
  );
}

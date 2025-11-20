'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { toast } from 'sonner';
import { dealsApi, dealStagesApi, CreateDealDto } from '@/lib/api/crm';
import { useCustomers, useCreateCustomer } from '@/hooks/use-api';

const createDealSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  customerId: z.string().uuid('Cliente inválido'),
  stageId: z.string().uuid('Etapa inválida'),
  amount: z.number().min(0, 'El monto debe ser mayor a 0'),
  currency: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  notes: z.string().optional(),
});

type CreateDealForm = z.infer<typeof createDealSchema>;

export default function NewDealPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  const { data: customersData, refetch: refetchCustomers } = useCustomers({ limit: 100 });
  const customers = customersData?.data?.data || [];
  const createCustomer = useCreateCustomer();

  const { data: stagesData } = useQuery({
    queryKey: ['deal-stages'],
    queryFn: () => dealStagesApi.getAll(),
  });
  const stages = stagesData?.data?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateDealForm>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      currency: 'USD',
      probability: 50,
    },
  });

  const selectedStageId = watch('stageId');
  const selectedStage = stages.find((s: any) => s.id === selectedStageId);

  // Auto-set probability based on stage
  if (selectedStage && watch('probability') !== selectedStage.probability) {
    setValue('probability', selectedStage.probability);
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateDealDto) => dealsApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal creado exitosamente');
      router.push(`/crm/deals/${response.data.id}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear el deal');
    },
  });

  const onSubmit = (data: CreateDealForm) => {
    createMutation.mutate({
      ...data,
      probability: data.probability || selectedStage?.probability || 50,
    });
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
        lastName: lastName || '',
        email: newCustomerEmail.trim(),
        type: 'lead',
        leadScore: 50,
      });

      toast.success('Cliente creado exitosamente');
      setShowCreateCustomerDialog(false);
      setNewCustomerName('');
      setNewCustomerEmail('');
      
      // Refetch customers and select the new one
      await refetchCustomers();
      if (newCustomer?.data?.id) {
        setValue('customerId', newCustomer.data.id);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al crear el cliente');
    }
  };

  return (
    <ErrorBoundary>
      <div>
        <SectionHeader
          title="Nuevo Deal"
          description="Crea una nueva oportunidad en el pipeline"
          actions={
            <Button variant="outline" asChild>
              <TenantLink href="/crm/pipeline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </TenantLink>
            </Button>
          }
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>
                    Completa los datos principales del deal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="mb-2 block">Nombre del Deal *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Ej: Implementación CRM - Empresa XYZ"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="customerId">Cliente *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCreateCustomerDialog(true)}
                        className="h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Nuevo Cliente
                      </Button>
                    </div>
                    <Select
                      value={watch('customerId')}
                      onValueChange={(value) => setValue('customerId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer: any) => {
                          const displayName = customer.companyName || 
                            `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
                            customer.email ||
                            'Cliente sin nombre';
                          return (
                            <SelectItem key={customer.id} value={customer.id}>
                              {displayName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.customerId && (
                      <p className="text-sm text-red-500 mt-1">{errors.customerId.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stageId" className="mb-2 block">Etapa *</Label>
                      <Select
                        value={watch('stageId')}
                        onValueChange={(value) => setValue('stageId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una etapa" />
                        </SelectTrigger>
                        <SelectContent>
                          {stages
                            .filter((s: any) => s.isActive)
                            .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                            .map((stage: any) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.displayName} ({stage.probability}%)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {errors.stageId && (
                        <p className="text-sm text-red-500 mt-1">{errors.stageId.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="probability" className="mb-2 block">Probabilidad (%)</Label>
                      <Input
                        id="probability"
                        type="number"
                        min="0"
                        max="100"
                        {...register('probability', { valueAsNumber: true })}
                      />
                      {errors.probability && (
                        <p className="text-sm text-red-500 mt-1">{errors.probability.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount" className="mb-2 block">Monto *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register('amount', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                      {errors.amount && (
                        <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="currency" className="mb-2 block">Moneda</Label>
                      <Select
                        value={watch('currency') || 'USD'}
                        onValueChange={(value) => setValue('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - Dólar</SelectItem>
                          <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                          <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                          <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                          <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                          <SelectItem value="BRL">BRL - Real Brasileño</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expectedCloseDate" className="mb-2 block">Fecha de Cierre Esperada</Label>
                      <Input
                        id="expectedCloseDate"
                        type="date"
                        {...register('expectedCloseDate')}
                      />
                    </div>

                    <div>
                      <Label htmlFor="assignedTo" className="mb-2 block">Asignado a</Label>
                      <Select
                        value={watch('assignedTo') || 'none'}
                        onValueChange={(value) => {
                          // "none" means unassigned, set to undefined
                          setValue('assignedTo', value === 'none' ? undefined : value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {/* TODO: Load users from API */}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="mb-2 block">Notas</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Notas adicionales sobre el deal..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valor del Deal</p>
                    <p className="text-2xl font-bold">
                      ${watch('amount')?.toLocaleString() || '0'} {watch('currency') || 'USD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valor Ponderado</p>
                    <p className="text-xl font-semibold">
                      ${((watch('amount') || 0) * (watch('probability') || 0) / 100).toLocaleString()}
                    </p>
                  </div>
                  {selectedStage && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Etapa Seleccionada</p>
                      <div className="flex items-center gap-2">
                        {selectedStage.color && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: selectedStage.color }}
                          />
                        )}
                        <span className="font-medium">{selectedStage.displayName}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Guardando...' : 'Crear Deal'}
                </Button>
              </div>
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
              <div>
                <Label htmlFor="newCustomerName" className="mb-2 block">Nombre Completo *</Label>
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
              <div>
                <Label htmlFor="newCustomerEmail" className="mb-2 block">Email *</Label>
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
      </div>
    </ErrorBoundary>
  );
}


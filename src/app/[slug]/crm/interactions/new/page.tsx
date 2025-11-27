'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Combobox } from '@/components/ui/combobox';
import { Tooltip, TooltipContent, TooltipProviderImmediate, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Save, Phone, Mail, MessageCircle, Calendar, FileText, CheckCircle, HelpCircle } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { interactionsApi, CreateInteractionDto } from '@/lib/api/crm';
import { useCustomers } from '@/hooks/use-api';
import { InteractionType } from '@/types/customer';

export default function NewInteractionPage() {
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  
  const { data: customersData } = useCustomers({ limit: 100 });
  const customers = customersData || [];

  const [customerId, setCustomerId] = useState<string>('');
  const [type, setType] = useState<InteractionType>('call');
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('outbound');
  const [status, setStatus] = useState<'completed' | 'scheduled'>('completed');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const createInteraction = useMutation({
    mutationFn: (data: CreateInteractionDto) => interactionsApi.create(data),
    onSuccess: (response) => {
      const interaction = response.data;
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'customers', interaction.customerId] });
      toast.success('Interacción creada exitosamente');
      router.push(route(`/crm/interactions`));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear la interacción');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId) {
      toast.error('Debes seleccionar un cliente');
      return;
    }
    
    if (!subject.trim()) {
      toast.error('El asunto es requerido');
      return;
    }
    
    try {
      await createInteraction.mutateAsync({
        customerId,
        type,
        direction,
        subject: subject.trim(),
        content: content.trim() || undefined,
        status,
        scheduledAt: status === 'scheduled' && scheduledAt ? scheduledAt : undefined,
      });
    } catch (error) {
      // Error is handled by mutation
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Nueva Interacción"
          description="Registra una nueva interacción con un cliente"
          actions={
            <Button variant="outline" asChild>
              <TenantLink href={route('/crm/interactions')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </TenantLink>
            </Button>
          }
        />

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Información de la Interacción</CardTitle>
              <CardDescription>
                Completa los datos principales de la interacción
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="customerId" className="text-sm font-medium">
                  Cliente *
                </Label>
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
                  value={customerId}
                  onValueChange={setCustomerId}
                  placeholder="Buscar o seleccionar cliente..."
                  searchPlaceholder="Buscar cliente por nombre, empresa o email..."
                  emptyText="No se encontraron clientes"
                  allowCustom={false}
                />
              </div>

              {/* Tipo y Dirección en una fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Interacción */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="type">Tipo de Interacción</Label>
                    <TooltipProviderImmediate>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-nidia-green transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="max-w-xs">
                          <p className="font-semibold mb-2 text-nidia-green">Tipos de Interacción</p>
                          <ul className="text-sm space-y-1.5">
                            <li>• <strong>Llamada:</strong> Conversaciones telefónicas</li>
                            <li>• <strong>Email:</strong> Comunicaciones por correo</li>
                            <li>• <strong>WhatsApp:</strong> Mensajes por WhatsApp</li>
                            <li>• <strong>Reunión:</strong> Encuentros presenciales o virtuales</li>
                            <li>• <strong>Nota:</strong> Anotaciones internas</li>
                            <li>• <strong>Tarea:</strong> Actividades pendientes</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProviderImmediate>
                  </div>
                  <Select value={type} onValueChange={(value) => setType(value as InteractionType)}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Selecciona el tipo de interacción">
                        {type === 'call' && 'Llamada'}
                        {type === 'email' && 'Email'}
                        {type === 'whatsapp' && 'WhatsApp'}
                        {type === 'meeting' && 'Reunión'}
                        {type === 'note' && 'Nota'}
                        {type === 'task' && 'Tarea'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">Llamada</span>
                          <span className="text-xs text-foreground/70">Conversación telefónica</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">Email</span>
                          <span className="text-xs text-foreground/70">Comunicación por correo electrónico</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">WhatsApp</span>
                          <span className="text-xs text-foreground/70">Mensaje por WhatsApp</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="meeting">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">Reunión</span>
                          <span className="text-xs text-foreground/70">Encuentro presencial o virtual</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="note">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">Nota</span>
                          <span className="text-xs text-foreground/70">Anotación interna del equipo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="task">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">Tarea</span>
                          <span className="text-xs text-foreground/70">Actividad pendiente o completada</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Dirección */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="direction">Dirección</Label>
                    <TooltipProviderImmediate>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-nidia-green transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="max-w-xs">
                          <p className="font-semibold mb-2 text-nidia-green">Dirección de la Interacción</p>
                          <ul className="text-sm space-y-1.5">
                            <li>• <strong>Saliente:</strong> Tú iniciaste la comunicación</li>
                            <li>• <strong>Entrante:</strong> El cliente inició la comunicación</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProviderImmediate>
                  </div>
                  <Select value={direction} onValueChange={(value) => setDirection(value as 'inbound' | 'outbound')}>
                    <SelectTrigger id="direction">
                      <SelectValue placeholder="Selecciona la dirección">
                        {direction === 'outbound' && 'Saliente'}
                        {direction === 'inbound' && 'Entrante'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">Saliente</span>
                          <span className="text-xs text-foreground/70">Tú iniciaste la comunicación</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="inbound">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">Entrante</span>
                          <span className="text-xs text-foreground/70">El cliente inició la comunicación</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Estado */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="status">Estado</Label>
                  <TooltipProviderImmediate>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-nidia-green transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-xs">
                        <p className="font-semibold mb-2 text-nidia-green">Estado de la Interacción</p>
                        <ul className="text-sm space-y-1.5">
                          <li>• <strong>Completada:</strong> La interacción ya ocurrió</li>
                          <li>• <strong>Programada:</strong> Interacción futura (reunión, llamada, etc.)</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProviderImmediate>
                </div>
                <Select value={status} onValueChange={(value) => setStatus(value as 'completed' | 'scheduled')}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecciona el estado">
                      {status === 'completed' && 'Completada'}
                      {status === 'scheduled' && 'Programada'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground">Completada</span>
                        <span className="text-xs text-foreground/70">La interacción ya ocurrió</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="scheduled">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground">Programada</span>
                        <span className="text-xs text-foreground/70">Interacción futura (reunión, llamada, etc.)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Fecha programada (si está programada) */}
              {status === 'scheduled' && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Fecha y Hora Programada</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Selecciona la fecha y hora en que se realizará esta interacción
                  </p>
                </div>
              )}
              
              {/* Asunto */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="subject">Asunto *</Label>
                  <TooltipProviderImmediate>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-nidia-green transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-xs">
                        <p className="font-semibold mb-2 text-nidia-green">¿Qué poner en el asunto?</p>
                        <ul className="text-sm space-y-1.5">
                          <li>• Título breve y descriptivo</li>
                          <li>• Ejemplos: "Llamada de seguimiento", "Propuesta comercial", "Reunión de presentación"</li>
                          <li>• Debe ser claro y específico</li>
                          <li>• Máximo 255 caracteres</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProviderImmediate>
                </div>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej: Llamada de seguimiento sobre propuesta comercial"
                  required
                />
              </div>
              
              {/* Descripción */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="content">Descripción</Label>
                  <TooltipProviderImmediate>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-nidia-green transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-sm">
                        <p className="font-semibold mb-2 text-nidia-green">¿Qué incluir en la descripción?</p>
                        <ul className="text-sm space-y-1.5">
                          <li>• <strong>Resumen:</strong> Qué se discutió o trató</li>
                          <li>• <strong>Resultados:</strong> Acuerdos, decisiones o conclusiones</li>
                          <li>• <strong>Próximos pasos:</strong> Acciones a seguir</li>
                          <li>• <strong>Detalles relevantes:</strong> Información importante mencionada</li>
                          <li>• <strong>Observaciones:</strong> Notas adicionales del equipo</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Ejemplo: "Conversación sobre requerimientos del proyecto. Cliente interesado en la propuesta. Acordamos enviar cotización detallada para el viernes."
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProviderImmediate>
                </div>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe los detalles de la interacción: qué se discutió, resultados, acuerdos, próximos pasos..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Incluye información relevante sobre la conversación, acuerdos, decisiones y próximos pasos
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" asChild>
                  <TenantLink href={route('/crm/interactions')}>
                    Cancelar
                  </TenantLink>
                </Button>
                <Button type="submit" disabled={createInteraction.isPending}>
                  {createInteraction.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </ErrorBoundary>
  );
}


'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Combobox } from '@/components/ui/combobox';
import { Tooltip, TooltipContent, TooltipProviderImmediate, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MessageCircle,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  User,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { interactionsApi, Interaction, CreateInteractionDto } from '@/lib/api/crm';
import { useCustomers } from '@/hooks/use-api';
import { InteractionType } from '@/types/customer';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

const INTERACTION_TYPE_CONFIG = {
  call: { icon: Phone, label: 'Llamada', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  email: { icon: Mail, label: 'Email', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  meeting: { icon: Calendar, label: 'Reunión', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  note: { icon: FileText, label: 'Nota', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
  task: { icon: CheckCircle, label: 'Tarea', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
};

// New Interaction Dialog Component
function NewInteractionDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: customersData } = useCustomers({ limit: 100 });
  const customers = customersData || [];

  const [customerId, setCustomerId] = useState<string>('');
  const [type, setType] = useState<InteractionType>('call');
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('outbound');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'completed' | 'scheduled'>('completed');
  const [scheduledAt, setScheduledAt] = useState('');
  
  const createInteraction = useMutation({
    mutationFn: (data: CreateInteractionDto) => interactionsApi.create(data),
    onSuccess: (response) => {
      const interaction = response.data;
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'customers', interaction.customerId] });
      toast.success('Interacción creada exitosamente');
      onOpenChange(false);
      setCustomerId('');
      setSubject('');
      setContent('');
      setScheduledAt('');
      setType('call');
      setDirection('outbound');
      setStatus('completed');
      onSuccess?.();
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
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent direction="right" className="h-full">
        <DrawerHeader className="text-left border-b">
          <DrawerTitle>Nueva Interacción</DrawerTitle>
          <DrawerDescription>
            Registra una nueva interacción con un cliente
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-5 max-w-2xl mx-auto">
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
            </div>
          </div>
          <DrawerFooter className="border-t">
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createInteraction.isPending}>
                {createInteraction.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

export default function InteractionsPage() {
  const { route } = useTenantRoutes();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewInteractionDialog, setShowNewInteractionDialog] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['interactions', typeFilter, statusFilter, searchQuery],
    queryFn: async () => {
      const response = await interactionsApi.getAll({
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchQuery || undefined,
        page: 1,
        limit: 20,
      });
      // La respuesta del API es: { success: true, data: [...], pagination: {...} }
      return response;
    },
  });

  const interactions = (data?.data || []) as Interaction[];
  const pagination = data?.pagination;

  // Debug: Log data in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Interactions data:', { data, interactions, pagination, isLoading, isError, error });
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Interacciones"
          description="Historial completo de todas las interacciones con clientes"
          actions={
            <Button onClick={() => setShowNewInteractionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Interacción
            </Button>
          }
        />

        {/* Filters */}
        {interactions.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar interacciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="call">Llamadas</SelectItem>
                  <SelectItem value="email">Emails</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="meeting">Reuniones</SelectItem>
                  <SelectItem value="note">Notas</SelectItem>
                  <SelectItem value="task">Tareas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="scheduled">Programadas</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        )}

        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          emptyFallback={null}
          onRetry={refetch}
        >
          {interactions.length > 0 ? (
            <div className="space-y-3">
              {interactions.map((interaction) => {
                const typeConfig = INTERACTION_TYPE_CONFIG[interaction.type];
                const TypeIcon = typeConfig.icon;

                return (
                  <Card key={interaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">
                                  {interaction.subject || `${typeConfig.label} con cliente`}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {interaction.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                                </Badge>
                                {interaction.status === 'scheduled' && (
                                  <Badge variant="secondary" className="text-xs">
                                    Programada
                                  </Badge>
                                )}
                              </div>
                              {interaction.customer && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <Building2 className="h-3 w-3" />
                                  <TenantLink
                                    href={route(`/crm/customers/${interaction.customerId}`)}
                                    className="hover:underline"
                                  >
                                    {interaction.customer.companyName ||
                                     `${interaction.customer.firstName || ''} ${interaction.customer.lastName || ''}`.trim() ||
                                     'Cliente'}
                                  </TenantLink>
                                </div>
                              )}
                              {interaction.content && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {interaction.content}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {interaction.createdByUser && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>
                                    {interaction.createdByUser.firstName} {interaction.createdByUser.lastName}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(new Date(interaction.createdAt), 'PPp', { locale: es })}
                                </span>
                              </div>
                              {interaction.durationMinutes && (
                                <span>Duración: {interaction.durationMinutes} min</span>
                              )}
                            </div>
                            {interaction.nextAction && (
                              <Badge variant="outline" className="text-xs">
                                Próxima: {interaction.nextAction}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-6">
                    <svg
                      width="200"
                      height="160"
                      viewBox="0 0 200 160"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="opacity-40"
                    >
                      <circle cx="100" cy="80" r="40" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
                      <circle cx="100" cy="80" r="40" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" fill="none" />
                      <circle cx="100" cy="80" r="25" fill="currentColor" className="text-muted-foreground" opacity="0.15" />
                      <circle cx="50" cy="40" r="15" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
                      <circle cx="50" cy="40" r="15" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
                      <circle cx="150" cy="40" r="15" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
                      <circle cx="150" cy="40" r="15" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
                      <circle cx="50" cy="120" r="15" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
                      <circle cx="50" cy="120" r="15" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
                      <circle cx="150" cy="120" r="15" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
                      <circle cx="150" cy="120" r="15" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hay interacciones aún</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
                    Registra tus interacciones con clientes (llamadas, emails, reuniones) para mantener un historial completo de comunicación
                  </p>
                  <Button onClick={() => setShowNewInteractionDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Interacción
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </QueryLoading>

        {/* New Interaction Dialog */}
        <NewInteractionDialog
          open={showNewInteractionDialog}
          onOpenChange={setShowNewInteractionDialog}
          onSuccess={() => {
            refetch();
          }}
        />
      </div>
    </ErrorBoundary>
  );
}


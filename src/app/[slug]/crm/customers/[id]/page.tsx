'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Building2,
  Calendar,
  Star,
  Plus,
  MoreHorizontal,
  User,
  CreditCard,
  FileText,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCustomer, useCreateInteraction, useCustomerInteractions, useCreateCustomerNote, useCustomerNotes, useCustomerContactsByCustomer, useCreateCustomerContact } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { useInteractionEvents, useCustomerNoteEvents } from '@/hooks/useWebSocket';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { Customer, CUSTOMER_TYPE_CONFIG, getLeadScoreInfo, Interaction, InteractionType } from '@/types/customer';
import { LeadScoreDetailed } from '@/components/crm/lead-score-indicator';
import { Tooltip, TooltipContent, TooltipProviderImmediate, TooltipTrigger } from '@/components/ui/tooltip';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { TenantLink } from '@/components/ui/tenant-link';
import { toast } from 'sonner';

// Helper function to map backend interaction data to frontend format
function mapInteractionData(interaction: any): Interaction {
  return {
    id: interaction.id,
    customerId: interaction.customerId,
    type: interaction.type,
    direction: interaction.direction,
    subject: interaction.subject,
    content: interaction.content,
    status: interaction.status,
    scheduledAt: interaction.scheduledAt,
    durationMinutes: interaction.durationMinutes,
    outcome: interaction.outcome,
    nextAction: interaction.nextAction,
    nextActionDate: interaction.nextActionDate,
    relatedOrderId: interaction.relatedOrderId,
    relatedTaskId: interaction.relatedTaskId,
    metadata: interaction.metadata,
    createdBy: interaction.createdBy,
    createdByName: interaction.createdByUser 
      ? `${interaction.createdByUser.firstName || ''} ${interaction.createdByUser.lastName || ''}`.trim() || interaction.createdByUser.email
      : undefined,
    createdAt: interaction.createdAt,
    updatedAt: interaction.updatedAt,
  };
}

// Interaction type icons and colors
const INTERACTION_CONFIG = {
  call: { icon: Phone, color: 'text-nidia-blue', bg: 'bg-blue-50 dark:bg-blue-950/40', iconBg: 'bg-background' },
  email: { icon: Mail, color: 'text-nidia-green', bg: 'bg-green-50 dark:bg-green-950/40', iconBg: 'bg-background' },
  whatsapp: { icon: MessageCircle, color: 'text-nidia-green', bg: 'bg-green-50 dark:bg-green-950/40', iconBg: 'bg-background' },
  meeting: { icon: Calendar, color: 'text-nidia-purple', bg: 'bg-purple-50 dark:bg-purple-950/40', iconBg: 'bg-background' },
  note: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted', iconBg: 'bg-background' },
  task: { icon: CheckCircle, color: 'text-nidia-turquoise', bg: 'bg-cyan-50 dark:bg-cyan-950/40', iconBg: 'bg-background' },
};

// Customer info section - Compact horizontal info bar
function CustomerInfo({ customer }: { customer: Customer }) {
  const typeConfig = CUSTOMER_TYPE_CONFIG[customer.type];
  const leadScoreInfo = getLeadScoreInfo(customer.leadScore);

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
      {/* Contact Info */}
      <div className="flex items-center gap-3">
          {customer.phone && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{customer.phone}</span>
            </div>
          )}
          {customer.whatsapp && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span>{customer.whatsapp}</span>
            </div>
          )}
            </div>

      {/* Divider */}
      {(customer.phone || customer.whatsapp) && (customer.companyName || customer.city) && (
        <div className="w-px h-5 bg-border" />
      )}

      {/* Company & Location */}
      <div className="flex items-center gap-3">
        {customer.companyName && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">{customer.companyName}</span>
          {customer.industry && (
              <span className="text-xs">• {customer.industry}</span>
          )}
          {customer.segment && (
              <span className="text-xs">• {customer.segment}</span>
            )}
            </div>
          )}
          {customer.city && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{customer.city}</span>
            </div>
          )}
      </div>

      {/* Divider */}
      {(customer.phone || customer.whatsapp || customer.companyName || customer.city) && (
        <div className="w-px h-5 bg-border" />
      )}

      {/* Status & Score */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={typeConfig.color}>
              {typeConfig.label}
            </Badge>
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span className={`text-sm font-semibold ${leadScoreInfo.color}`}>
            {customer.leadScore}
          </span>
          </div>
          {customer.leadSource && (
          <span className="text-xs text-muted-foreground">
            Fuente: <span className="font-medium capitalize">{customer.leadSource}</span>
          </span>
        )}
          </div>
          
      {/* Divider */}
      <div className="w-px h-5 bg-border" />

      {/* Dates */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            Creado: <span className="font-medium text-foreground">
              {new Date(customer.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            </span>
          </div>
          {customer.lastContactAt && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Último contacto: <span className="font-medium text-foreground">
                {new Date(customer.lastContactAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
              </span>
            </div>
          )}
          {customer.firstPurchaseAt && (
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            <span>
              Primera compra: <span className="font-medium text-foreground">
                {new Date(customer.firstPurchaseAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
              </span>
            </div>
          )}
      </div>
    </div>
  );
}

// New Interaction Dialog Component
function NewInteractionDialog({ 
  customerId, 
  open, 
  onOpenChange,
  onSuccess 
}: { 
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [type, setType] = useState<InteractionType>('call');
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('outbound');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'completed' | 'scheduled'>('completed');
  const [scheduledAt, setScheduledAt] = useState('');
  
  const createInteraction = useCreateInteraction();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      
      // Success toast is handled by the mutation hook
      onOpenChange(false);
      setSubject('');
      setContent('');
      setScheduledAt('');
      setType('call');
      setDirection('outbound');
      setStatus('completed');
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent direction="right" className="h-full">
        <DrawerHeader className="text-left border-b">
          <DrawerTitle>Nueva Interacción</DrawerTitle>
          <DrawerDescription>
            Registra una nueva interacción con el cliente
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-5 max-w-2xl mx-auto">
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

function NewNoteDialog({ 
  customerId, 
  open, 
  onOpenChange,
  onSuccess 
}: { 
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [content, setContent] = useState('');
  
  const createNote = useCreateCustomerNote();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('El contenido de la nota es requerido');
      return;
    }
    
    try {
      await createNote.mutateAsync({
        customerId,
        content: content.trim(),
        isInternal: true,
      });
      
      // Success toast is handled by the mutation hook
      onOpenChange(false);
      setContent('');
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };
        
        return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent direction="right" className="h-full">
        <DrawerHeader className="text-left border-b">
          <DrawerTitle>Nueva Nota</DrawerTitle>
          <DrawerDescription>
            Agrega una nota u observación sobre este cliente
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="content">Contenido de la Nota *</Label>
                  <TooltipProviderImmediate>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-nidia-green transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-sm">
                        <p className="font-semibold mb-2 text-nidia-green">¿Qué incluir en la nota?</p>
                        <ul className="text-sm space-y-1.5">
                          <li>• <strong>Observaciones:</strong> Comportamiento, preferencias, características del cliente</li>
                          <li>• <strong>Contexto:</strong> Situación actual, historial relevante</li>
                          <li>• <strong>Información importante:</strong> Datos que el equipo debe conocer</li>
                          <li>• <strong>Recordatorios:</strong> Aspectos a tener en cuenta en futuras interacciones</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Ejemplo: "Cliente interesado en productos premium. Prefiere comunicación por WhatsApp. Requiere seguimiento semanal."
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProviderImmediate>
                </div>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe aquí la nota u observación sobre el cliente..."
                  rows={10}
                  className="resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Esta nota es interna y solo visible para el equipo
                </p>
              </div>
            </div>
          </div>
          <DrawerFooter className="border-t">
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createNote.isPending}>
                {createNote.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

// Notes timeline - Visual timeline design similar to interactions
function NotesTimeline({ 
  notes, 
  customerId,
  onNoteCreated 
}: { 
  notes: any[];
  customerId: string;
  onNoteCreated?: () => void;
}) {
  const [showNewDialog, setShowNewDialog] = useState(false);
  
  if (notes.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-medium mb-1">Sin notas</h3>
          <p className="text-sm text-muted-foreground mb-4">
            No hay notas adicionales para este cliente
          </p>
          <Button size="sm" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Nota
          </Button>
        </div>
        <NewNoteDialog
          customerId={customerId}
          open={showNewDialog}
          onOpenChange={setShowNewDialog}
          onSuccess={onNoteCreated}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative">
        {/* Timeline line - más delgada y discreta */}
        <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-px bg-border/50" />
        
        <div className="space-y-3 sm:space-y-4">
          {notes.map((note: any) => {
            const formattedDate = new Date(note.createdAt);
            const isToday = formattedDate.toDateString() === new Date().toDateString();
            const isYesterday = formattedDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
            
            // Fecha y hora completa y clara
            const fullDate = formattedDate.toLocaleDateString('es-ES', { 
              weekday: 'short',
              day: 'numeric', 
              month: 'short',
              year: isToday || isYesterday ? undefined : 'numeric'
            });
            const fullTime = formattedDate.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            });
            
            let dateDisplay = '';
            if (isToday) {
              dateDisplay = `Hoy, ${fullTime}`;
            } else if (isYesterday) {
              dateDisplay = `Ayer, ${fullTime}`;
            } else {
              dateDisplay = `${fullDate}, ${fullTime}`;
            }
            
            return (
              <div key={note.id} className="relative flex gap-3 sm:gap-4 group">
                {/* Timeline dot - tamaño responsive */}
                <div className="relative z-10 flex-shrink-0 pt-0.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center border border-background/50 shadow-sm">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-nidia-purple" />
                  </div>
                </div>
                
                {/* Content - diseño más claro y legible */}
                <div className="flex-1 min-w-0 pb-3 sm:pb-4 border-b border-border/50 last:border-0">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Content - más legible */}
                      <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                      
                      {/* Metadata - información clara y destacada */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 pt-1">
                        {/* Quién lo hizo */}
                        {note.createdByUser && (
                          <div className="flex items-center gap-1.5 text-sm sm:text-base">
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-foreground">
                              {note.createdByUser.firstName && note.createdByUser.lastName
                                ? `${note.createdByUser.firstName} ${note.createdByUser.lastName}`
                                : note.createdByUser.email}
                            </span>
                          </div>
                        )}
                        
                        {/* Separador visual */}
                        {note.createdByUser && (
                          <span className="hidden sm:inline text-muted-foreground">•</span>
                        )}
                        
                        {/* Fecha y hora - muy clara */}
                        <div className="flex items-center gap-1.5 text-sm sm:text-base">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-foreground">{dateDisplay}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions menu - solo visible en hover */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <NewNoteDialog
        customerId={customerId}
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={onNoteCreated}
      />
    </>
  );
}

// Interactions timeline - Visual timeline design with better space usage
function InteractionsTimeline({ 
  interactions, 
  customerId,
  onInteractionCreated 
}: { 
  interactions: Interaction[];
  customerId: string;
  onInteractionCreated?: () => void;
}) {
  const [showNewDialog, setShowNewDialog] = useState(false);
  
  if (interactions.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <Activity className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-medium mb-1">Sin interacciones</h3>
          <p className="text-sm text-muted-foreground mb-4">
            No hay interacciones registradas para este cliente
          </p>
          <Button size="sm" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Interacción
          </Button>
        </div>
        <NewInteractionDialog
          customerId={customerId}
          open={showNewDialog}
          onOpenChange={setShowNewDialog}
          onSuccess={onInteractionCreated}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative">
        {/* Timeline line - más delgada y discreta */}
        <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-px bg-border/50" />
        
        <div className="space-y-3 sm:space-y-4">
          {interactions.map((interaction, index) => {
        const config = INTERACTION_CONFIG[interaction.type];
        const Icon = config.icon;
            const date = interaction.scheduledAt || interaction.createdAt;
            const isScheduled = interaction.status === 'scheduled';
            const formattedDate = new Date(date);
            const isToday = formattedDate.toDateString() === new Date().toDateString();
            const isYesterday = formattedDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
            
            // Fecha y hora completa y clara
            const fullDate = formattedDate.toLocaleDateString('es-ES', { 
              weekday: 'short',
              day: 'numeric', 
              month: 'short',
              year: isToday || isYesterday ? undefined : 'numeric'
            });
            const fullTime = formattedDate.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            });
            
            let dateDisplay = '';
            if (isToday) {
              dateDisplay = `Hoy, ${fullTime}`;
            } else if (isYesterday) {
              dateDisplay = `Ayer, ${fullTime}`;
            } else {
              dateDisplay = `${fullDate}, ${fullTime}`;
            }
        
        return (
              <div key={interaction.id} className="relative flex gap-3 sm:gap-4 group">
                {/* Timeline dot - tamaño responsive */}
                <div className="relative z-10 flex-shrink-0 pt-0.5">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${config.bg} flex items-center justify-center border border-background/50 shadow-sm`}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${config.color}`} />
                  </div>
                    </div>
                    
                {/* Content - diseño más claro y legible */}
                <div className="flex-1 min-w-0 pb-3 sm:pb-4 border-b border-border/50 last:border-0">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Header: Subject + badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-base sm:text-lg text-foreground">{interaction.subject || 'Sin asunto'}</h4>
                        {isScheduled && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 sm:h-6">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Programado</span>
                            <span className="sm:hidden">Prog.</span>
                          </Badge>
                        )}
                      {interaction.direction && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 sm:h-6 border-border/50">
                            {interaction.direction === 'inbound' ? '↩ Entrante' : '↪ Saliente'}
                        </Badge>
                      )}
                    {interaction.outcome && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 sm:h-6 border-border/50">
                        {interaction.outcome}
                      </Badge>
                    )}
                  </div>
                  
                      {/* Content - más legible */}
                  {interaction.content && (
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-2">
                      {interaction.content}
                    </p>
                  )}
                  
                      {/* Metadata - información clara y destacada */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 pt-1">
                        {/* Quién lo hizo */}
                        {interaction.createdByName && (
                          <div className="flex items-center gap-1.5 text-sm sm:text-base">
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-foreground">{interaction.createdByName}</span>
                          </div>
                        )}
                        
                        {/* Separador visual */}
                        {interaction.createdByName && (
                          <span className="hidden sm:inline text-muted-foreground">•</span>
                        )}
                        
                        {/* Fecha y hora - muy clara */}
                        <div className="flex items-center gap-1.5 text-sm sm:text-base">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-foreground">{dateDisplay}</span>
                    </div>
                    
                        {/* Duración */}
                        {interaction.durationMinutes && (
                          <>
                            <span className="hidden sm:inline text-muted-foreground">•</span>
                            <div className="flex items-center gap-1.5 text-sm sm:text-base">
                              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">{interaction.durationMinutes} min</span>
                            </div>
                          </>
                    )}
                  </div>
                  
                      {/* Next action - más legible */}
                  {interaction.nextAction && (
                        <div className="mt-2 px-3 py-2 bg-warning/10 dark:bg-warning/20 border border-warning/20 dark:border-warning/30 rounded-md">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-xs sm:text-sm font-semibold text-warning/90 dark:text-warning/80">Próxima acción:</span>
                      </div>
                              <p className="text-sm sm:text-base text-warning/80 dark:text-warning/70 leading-relaxed">
                        {interaction.nextAction}
                      </p>
                      {interaction.nextActionDate && (
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                  {new Date(interaction.nextActionDate).toLocaleDateString('es-ES', { 
                                    weekday: 'long',
                                    day: 'numeric', 
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                        </p>
                      )}
                            </div>
                          </div>
                    </div>
                  )}
                </div>
                    
                    {/* Actions menu - solo visible en hover */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
              </div>
                </div>
              </div>
        );
      })}
        </div>
    </div>
      <NewInteractionDialog
        customerId={customerId}
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={onInteractionCreated}
      />
    </>
  );
}

// Contacts List Component
function ContactsList({ 
  contacts, 
  customerId,
  onContactCreated 
}: { 
  contacts: any[];
  customerId: string;
  onContactCreated?: () => void;
}) {
  const [showNewDialog, setShowNewDialog] = useState(false);
  
  if (contacts.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <User className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-medium mb-1">Sin contactos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            No hay contactos registrados para este cliente
          </p>
          <Button size="sm" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Contacto
          </Button>
        </div>
        <NewContactDialog
          customerId={customerId}
          open={showNewDialog}
          onOpenChange={setShowNewDialog}
          onSuccess={onContactCreated}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {contacts.map((contact: any) => (
          <div key={contact.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nidia-green to-nidia-turquoise flex items-center justify-center text-white font-semibold">
                  {contact.firstName?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-base">
                      {contact.firstName} {contact.lastName || ''}
                    </h4>
                    {contact.isPrimary && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                        Principal
                      </Badge>
                    )}
                    {!contact.isActive && (
                      <Badge variant="outline" className="text-xs">Inactivo</Badge>
      )}
    </div>
                  {contact.position && (
                    <p className="text-sm text-muted-foreground">{contact.position}</p>
                  )}
                  {contact.department && (
                    <p className="text-xs text-muted-foreground">{contact.department}</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground ml-12">
                {contact.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    <span>{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                {contact.mobile && (
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4" />
                    <span>{contact.mobile}</span>
                  </div>
                )}
              </div>
              
              {contact.notes && (
                <p className="text-sm text-muted-foreground ml-12 line-clamp-2">{contact.notes}</p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {!contact.isPrimary && (
                  <DropdownMenuItem>
                    <Star className="mr-2 h-4 w-4" />
                    Marcar como principal
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
      <NewContactDialog
        customerId={customerId}
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={onContactCreated}
      />
    </>
  );
}

// New Contact Dialog Component
function NewContactDialog({ 
  customerId, 
  open, 
  onOpenChange,
  onSuccess 
}: { 
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState('');
  
  const createContact = useCreateCustomerContact();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    
    try {
      await createContact.mutateAsync({
        customerId,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        position: position.trim() || undefined,
        department: department.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        mobile: mobile.trim() || undefined,
        isPrimary,
        notes: notes.trim() || undefined,
      });
      
      onOpenChange(false);
      setFirstName('');
      setLastName('');
      setPosition('');
      setDepartment('');
      setEmail('');
      setPhone('');
      setMobile('');
      setIsPrimary(false);
      setNotes('');
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent direction="right" className="h-full">
        <DrawerHeader className="text-left border-b">
          <DrawerTitle>Nuevo Contacto</DrawerTitle>
          <DrawerDescription>
            Agrega una persona de contacto para este cliente
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-5 max-w-2xl mx-auto">
              {/* Nombre y Apellido - 2 columnas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej: María"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej: García"
                  />
                </div>
              </div>
              
              {/* Cargo y Departamento - 2 columnas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Ej: Gerente de Ventas"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ej: Ventas"
                  />
                </div>
              </div>
              
              {/* Email - ancho completo */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: maria.garcia@empresa.com"
                />
              </div>
              
              {/* Teléfono y Móvil - 2 columnas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <PhoneInput
                    id="phone"
                    value={phone}
                    onChange={(value) => setPhone(value || '')}
                    placeholder="Ej: +57 300 123 4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mobile">Móvil</Label>
                  <PhoneInput
                    id="mobile"
                    value={mobile}
                    onChange={(value) => setMobile(value || '')}
                    placeholder="Ej: +57 300 123 4567"
                  />
                </div>
              </div>
              
              {/* Checkbox - ancho completo */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isPrimary" className="cursor-pointer">
                  Marcar como contacto principal
                </Label>
              </div>
              
              {/* Notas - ancho completo */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Información adicional sobre este contacto..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
          <DrawerFooter className="border-t">
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createContact.isPending}>
                {createContact.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const [showNewInteractionDialog, setShowNewInteractionDialog] = useState(false);
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [showNewContactDialog, setShowNewContactDialog] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: customer, isLoading, isError, error } = useCustomer(customerId);
  const { data: interactionsData, isLoading: isLoadingInteractions, refetch: refetchInteractions } = useCustomerInteractions(customerId);
  const { data: notesData, isLoading: isLoadingNotes, refetch: refetchNotes } = useCustomerNotes(customerId);
  const { data: contactsData, isLoading: isLoadingContacts, refetch: refetchContacts } = useCustomerContactsByCustomer(customerId);
  
  // Map backend data to frontend format
  // useApiQuery already extracts data.data, so interactionsData is the array directly
  const interactions: Interaction[] = interactionsData && Array.isArray(interactionsData)
    ? interactionsData.map(mapInteractionData)
    : [];
  
  // Map backend notes data to frontend format
  const notes = notesData && Array.isArray(notesData) ? notesData : [];
  
  // Map backend contacts data to frontend format
  const contacts = contactsData && Array.isArray(contactsData) ? contactsData : [];
  
  // Listen to interaction events for real-time updates
  useInteractionEvents(
    (data) => {
      // Only refetch if the interaction belongs to this customer
      if (data.customerId === customerId) {
        refetchInteractions();
        queryClient.invalidateQueries({ queryKey: ['crm', 'customers', customerId] });
      }
    },
    (data) => {
      if (data.customerId === customerId) {
        refetchInteractions();
      }
    },
    (data) => {
      if (data.customerId === customerId) {
        refetchInteractions();
      }
    }
  );
  
  // Listen to note events for real-time updates
  useCustomerNoteEvents(
    (data) => {
      if (data.customerId === customerId) {
        refetchNotes();
      }
    },
    (data) => {
      if (data.customerId === customerId) {
        refetchNotes();
      }
    },
    (data) => {
      if (data.customerId === customerId) {
        refetchNotes();
      }
    }
  );
  
  const { route } = useTenantRoutes();
  
  // Determinar si el error es 404 (cliente no encontrado) vs otro error
  const isNotFoundError = error && 'response' in error && (error as any).response?.status === 404;
  const isPermissionError = error && 'response' in error && (error as any).response?.status === 403;
  
  const handleInteractionCreated = () => {
    // Refetch customer data to update lastContactAt
    queryClient.invalidateQueries({ queryKey: ['crm', 'customers', customerId] });
    // Invalidate interactions list
    queryClient.invalidateQueries({ queryKey: ['crm', 'interactions', customerId] });
  };
  
  const handleEdit = () => {
    router.push(route(`/crm/customers/${customerId}/edit`));
  };
  
  const handleContact = (type: 'email' | 'phone' | 'whatsapp') => {
    if (!customer) return;
    
    switch (type) {
      case 'email':
        window.open(`mailto:${customer.email}`);
        break;
      case 'phone':
        if (customer.phone) {
          window.open(`tel:${customer.phone}`);
        }
        break;
      case 'whatsapp':
        if (customer.whatsapp) {
          const cleanNumber = customer.whatsapp.replace(/\D/g, '');
          window.open(`https://wa.me/${cleanNumber}`);
        }
        break;
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title={customer ? `${customer.firstName} ${customer.lastName}` : 'Detalle del Cliente'}
          description={customer ? customer.email : 'Información completa y historial de interacciones'}
          showBack
          onBack={() => router.push(route('/crm/customers'))}
          actions={
            customer && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleContact('email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                {customer.phone && (
                  <Button variant="outline" size="sm" onClick={() => handleContact('phone')}>
                    <Phone className="h-4 w-4 mr-2" />
                    Llamar
                  </Button>
                )}
                {customer.whatsapp && (
                  <Button variant="outline" size="sm" onClick={() => handleContact('whatsapp')}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
                <Button size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </>
            )
          }
        />

        <QueryLoading
          isLoading={isLoading}
          isError={isError && !isNotFoundError}
          error={isNotFoundError ? null : (error as Error)}
          isEmpty={!customer || !!isNotFoundError}
          loadingFallback={
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          }
          errorFallback={
            isPermissionError ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Sin permisos</h3>
                <p className="text-muted-foreground mb-4">
                  No tienes permisos para ver este cliente
                </p>
                <Button onClick={() => router.push(route('/crm/customers'))}>
                  Volver a la lista
                </Button>
              </div>
            ) : undefined
          }
          emptyFallback={
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Cliente no encontrado</h3>
              <p className="text-muted-foreground mb-4">
                El cliente que buscas no existe o ha sido eliminado
              </p>
              <Button onClick={() => router.push(route('/crm/customers'))}>
                Volver a la lista
              </Button>
            </div>
          }
          onRetry={() => {
            // Refetch on retry
            window.location.reload();
          }}
        >
          {customer && (
            <div className="space-y-6">
              {/* Customer Info - Compact horizontal bar */}
              <CustomerInfo customer={customer} />

              {/* Tabs for detailed information */}
              <Tabs defaultValue="interactions" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="interactions">Interacciones</TabsTrigger>
                  <TabsTrigger value="contacts">Contactos</TabsTrigger>
                  <TabsTrigger value="orders">Órdenes</TabsTrigger>
                  <TabsTrigger value="financial">Financiero</TabsTrigger>
                  <TabsTrigger value="notes">Notas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="interactions" className="mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">Historial de Interacciones</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {interactions.length} {interactions.length === 1 ? 'interacción' : 'interacciones'}
                          </CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setShowNewInteractionDialog(true)} className="h-8">
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Nueva Interacción
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      {isLoadingInteractions ? (
                        <div className="text-center py-8">
                          <Activity className="mx-auto h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                          <p className="text-xs text-muted-foreground">Cargando interacciones...</p>
                        </div>
                      ) : (
                        <InteractionsTimeline 
                          interactions={interactions} 
                          customerId={customerId}
                          onInteractionCreated={handleInteractionCreated}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="contacts" className="mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">Contactos del Cliente</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            Personas de contacto en esta empresa
                          </CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setShowNewContactDialog(true)} className="h-8">
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Nuevo Contacto
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      {isLoadingContacts ? (
                        <div className="text-center py-8">
                          <User className="mx-auto h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                          <p className="text-xs text-muted-foreground">Cargando contactos...</p>
                        </div>
                      ) : (
                        <ContactsList 
                          contacts={contacts} 
                          customerId={customerId}
                          onContactCreated={() => {
                            refetchContacts();
                            queryClient.invalidateQueries({ queryKey: ['crm', 'customers', customerId] });
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="orders" className="mt-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Órdenes y Ventas</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Historial de compras y órdenes del cliente
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                        <h3 className="text-base font-medium mb-1">Sin órdenes</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Este cliente aún no tiene órdenes registradas
                        </p>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Orden
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="financial" className="mt-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Información Financiera</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Límites de crédito, términos de pago y estado financiero
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-muted-foreground">Límite de Crédito:</span>
                            <span className="text-sm font-medium">
                              {customer.creditLimit 
                                ? `$${customer.creditLimit.toLocaleString('es-CO')}` 
                                : 'No definido'
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-muted-foreground">Términos de Pago:</span>
                            <span className="text-sm font-medium">
                              {customer.paymentTerms === 0 
                                ? 'Contado' 
                                : `${customer.paymentTerms} días`
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-muted-foreground">Estado:</span>
                            <Badge variant={customer.isActive ? 'default' : 'secondary'} className="text-xs">
                              {customer.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-muted-foreground">Total Facturado:</span>
                            <span className="text-sm font-bold">$0</span>
                          </div>
                          
                          <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-muted-foreground">Saldo Pendiente:</span>
                            <span className="text-sm">$0</span>
                          </div>
                          
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-muted-foreground">Última Factura:</span>
                            <span className="text-sm text-muted-foreground">N/A</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notes" className="mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold">Notas y Observaciones</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
                      </CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setShowNewNoteDialog(true)} className="h-8">
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Nueva Nota
                          </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      {isLoadingNotes ? (
                        <div className="text-center py-8">
                          <Activity className="mx-auto h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                          <p className="text-xs text-muted-foreground">Cargando notas...</p>
                        </div>
                      ) : (
                        <NotesTimeline 
                          notes={notes} 
                          customerId={customerId}
                          onNoteCreated={() => {
                            refetchNotes();
                            queryClient.invalidateQueries({ queryKey: ['crm', 'customers', customerId] });
                          }}
                        />
                      )}
                      
                      {customer.tags && customer.tags.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="text-sm font-medium mb-3">Etiquetas:</h4>
                          <div className="flex flex-wrap gap-2">
                            {customer.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </QueryLoading>
        
        {/* New Interaction Dialog */}
        {customer && (
          <>
            <NewInteractionDialog
              customerId={customerId}
              open={showNewInteractionDialog}
              onOpenChange={setShowNewInteractionDialog}
              onSuccess={handleInteractionCreated}
            />
            <NewNoteDialog
              customerId={customerId}
              open={showNewNoteDialog}
              onOpenChange={setShowNewNoteDialog}
              onSuccess={() => {
                refetchNotes();
                queryClient.invalidateQueries({ queryKey: ['crm', 'customers', customerId] });
              }}
            />
            <NewContactDialog
              customerId={customerId}
              open={showNewContactDialog}
              onOpenChange={setShowNewContactDialog}
              onSuccess={() => {
                refetchContacts();
                queryClient.invalidateQueries({ queryKey: ['crm', 'customers', customerId] });
              }}
            />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
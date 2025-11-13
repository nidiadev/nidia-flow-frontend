'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCustomer } from '@/hooks/use-api';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Customer, CUSTOMER_TYPE_CONFIG, getLeadScoreInfo, Interaction } from '@/types/customer';
import { LeadScoreDetailed } from '@/components/crm/lead-score-indicator';
import { toast } from 'sonner';

// Mock data for interactions - in real app this would come from API
const mockInteractions: Interaction[] = [
  {
    id: '1',
    customerId: '1',
    type: 'call',
    direction: 'outbound',
    subject: 'Llamada de seguimiento',
    content: 'Conversación sobre los requerimientos del proyecto. Cliente interesado en la propuesta.',
    status: 'completed',
    durationMinutes: 15,
    outcome: 'interested',
    nextAction: 'Enviar propuesta comercial',
    nextActionDate: '2024-01-20T10:00:00Z',
    createdBy: 'user1',
    createdByName: 'Juan Pérez',
    createdAt: '2024-01-15T14:30:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: '2',
    customerId: '1',
    type: 'email',
    direction: 'outbound',
    subject: 'Propuesta comercial - Proyecto XYZ',
    content: 'Envío de propuesta comercial detallada con cronograma y presupuesto.',
    status: 'completed',
    createdBy: 'user1',
    createdByName: 'Juan Pérez',
    createdAt: '2024-01-16T09:15:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
  },
  {
    id: '3',
    customerId: '1',
    type: 'meeting',
    direction: 'inbound',
    subject: 'Reunión de presentación',
    content: 'Reunión presencial para presentar la propuesta y resolver dudas.',
    status: 'scheduled',
    scheduledAt: '2024-01-22T15:00:00Z',
    durationMinutes: 60,
    createdBy: 'user1',
    createdByName: 'Juan Pérez',
    createdAt: '2024-01-17T11:00:00Z',
    updatedAt: '2024-01-17T11:00:00Z',
  },
];

// Interaction type icons and colors
const INTERACTION_CONFIG = {
  call: { icon: Phone, color: 'text-nidia-blue', bg: 'bg-nidia-blue/10' },
  email: { icon: Mail, color: 'text-nidia-green', bg: 'bg-nidia-green/10' },
  whatsapp: { icon: MessageCircle, color: 'text-nidia-green', bg: 'bg-nidia-green/10' },
  meeting: { icon: Calendar, color: 'text-nidia-purple', bg: 'bg-nidia-purple/10' },
  note: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
  task: { icon: CheckCircle, color: 'text-nidia-turquoise', bg: 'bg-nidia-turquoise/10' },
};

// Customer info section
function CustomerInfo({ customer }: { customer: Customer }) {
  const typeConfig = CUSTOMER_TYPE_CONFIG[customer.type];
  const leadScoreInfo = getLeadScoreInfo(customer.leadScore);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-nidia-green to-nidia-purple rounded-full flex items-center justify-center text-white font-medium">
              {customer.firstName?.[0]}{customer.lastName?.[0]}
            </div>
            <div>
              <p className="font-medium">{customer.firstName} {customer.lastName}</p>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
            </div>
          </div>
          
          {customer.phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
              {customer.phone}
            </div>
          )}
          
          {customer.whatsapp && (
            <div className="flex items-center text-sm">
              <MessageCircle className="h-4 w-4 mr-2 text-muted-foreground" />
              {customer.whatsapp}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customer.companyName && (
            <div className="flex items-center text-sm">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              {customer.companyName}
            </div>
          )}
          
          {customer.industry && (
            <div className="text-sm">
              <span className="text-muted-foreground">Industria:</span>
              <span className="ml-1 capitalize">{customer.industry}</span>
            </div>
          )}
          
          {customer.segment && (
            <div className="text-sm">
              <span className="text-muted-foreground">Segmento:</span>
              <span className="ml-1">{customer.segment}</span>
            </div>
          )}
          
          {customer.city && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              {customer.city}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status & Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Estado y Puntuación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Badge variant={typeConfig.variant} className={typeConfig.color}>
              {typeConfig.label}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {typeConfig.description}
            </p>
          </div>
          
          <LeadScoreDetailed 
            score={customer.leadScore}
            className="justify-start"
          />
          
          {customer.leadSource && (
            <div className="text-sm">
              <span className="text-muted-foreground">Fuente:</span>
              <span className="ml-1 capitalize">{customer.leadSource}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Fechas Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <span className="text-muted-foreground">Creado:</span>
            <span className="ml-1">
              {new Date(customer.createdAt).toLocaleDateString('es-ES')}
            </span>
          </div>
          
          {customer.lastContactAt && (
            <div className="text-sm">
              <span className="text-muted-foreground">Último contacto:</span>
              <span className="ml-1">
                {new Date(customer.lastContactAt).toLocaleDateString('es-ES')}
              </span>
            </div>
          )}
          
          {customer.firstPurchaseAt && (
            <div className="text-sm">
              <span className="text-muted-foreground">Primera compra:</span>
              <span className="ml-1">
                {new Date(customer.firstPurchaseAt).toLocaleDateString('es-ES')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Interactions timeline
function InteractionsTimeline({ interactions }: { interactions: Interaction[] }) {
  return (
    <div className="space-y-4">
      {interactions.map((interaction) => {
        const config = INTERACTION_CONFIG[interaction.type];
        const Icon = config.icon;
        
        return (
          <Card key={interaction.id}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-full ${config.bg}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{interaction.subject}</h4>
                      {interaction.direction && (
                        <Badge variant="outline" className="text-xs">
                          {interaction.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                        </Badge>
                      )}
                      {interaction.status === 'scheduled' && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Programado
                        </Badge>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
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
                  
                  {interaction.content && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {interaction.content}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{interaction.createdByName}</span>
                      <span>
                        {interaction.scheduledAt 
                          ? new Date(interaction.scheduledAt).toLocaleString('es-ES')
                          : new Date(interaction.createdAt).toLocaleString('es-ES')
                        }
                      </span>
                      {interaction.durationMinutes && (
                        <span>{interaction.durationMinutes} min</span>
                      )}
                    </div>
                    
                    {interaction.outcome && (
                      <Badge variant="outline" className="text-xs">
                        {interaction.outcome}
                      </Badge>
                    )}
                  </div>
                  
                  {interaction.nextAction && (
                    <div className="mt-2 p-2 bg-muted rounded-lg">
                      <div className="flex items-center text-sm">
                        <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                        <span className="font-medium">Próxima acción:</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {interaction.nextAction}
                      </p>
                      {interaction.nextActionDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Fecha: {new Date(interaction.nextActionDate).toLocaleString('es-ES')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {interactions.length === 0 && (
        <div className="text-center py-8">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin interacciones</h3>
          <p className="text-muted-foreground mb-4">
            No hay interacciones registradas para este cliente
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Interacción
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const { data: customer, isLoading, isError, error } = useCustomer(customerId);
  
  const handleEdit = () => {
    router.push(`/crm/customers/${customerId}/edit`);
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
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            
            <div>
              <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">
                Detalle del Cliente
              </h1>
              <p className="text-muted-foreground">
                Información completa y historial de interacciones
              </p>
            </div>
          </div>
          
          {customer && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handleContact('email')}>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              
              {customer.phone && (
                <Button variant="outline" onClick={() => handleContact('phone')}>
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar
                </Button>
              )}
              
              {customer.whatsapp && (
                <Button variant="outline" onClick={() => handleContact('whatsapp')}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              )}
              
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          )}
        </div>

        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={!customer}
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
          emptyFallback={
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Cliente no encontrado</h3>
              <p className="text-muted-foreground mb-4">
                El cliente que buscas no existe o ha sido eliminado
              </p>
              <Button onClick={() => router.push('/crm/customers')}>
                Volver a la lista
              </Button>
            </div>
          }
        >
          {customer && (
            <div className="space-y-8">
              {/* Customer Info Cards */}
              <CustomerInfo customer={customer} />

              {/* Tabs for detailed information */}
              <Tabs defaultValue="interactions" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="interactions">Interacciones</TabsTrigger>
                  <TabsTrigger value="orders">Órdenes</TabsTrigger>
                  <TabsTrigger value="financial">Financiero</TabsTrigger>
                  <TabsTrigger value="notes">Notas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="interactions" className="mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Historial de Interacciones</CardTitle>
                          <CardDescription>
                            Registro completo de comunicaciones y actividades
                          </CardDescription>
                        </div>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nueva Interacción
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <InteractionsTimeline interactions={mockInteractions} />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="orders" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Órdenes y Ventas</CardTitle>
                      <CardDescription>
                        Historial de compras y órdenes del cliente
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Sin órdenes</h3>
                        <p className="text-muted-foreground mb-4">
                          Este cliente aún no tiene órdenes registradas
                        </p>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Orden
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="financial" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Información Financiera</CardTitle>
                      <CardDescription>
                        Límites de crédito, términos de pago y estado financiero
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Límite de Crédito:</span>
                            <span className="text-sm">
                              {customer.creditLimit 
                                ? `$${customer.creditLimit.toLocaleString('es-CO')}` 
                                : 'No definido'
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Términos de Pago:</span>
                            <span className="text-sm">
                              {customer.paymentTerms === 0 
                                ? 'Contado' 
                                : `${customer.paymentTerms} días`
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Estado:</span>
                            <Badge variant={customer.isActive ? 'success' : 'secondary'}>
                              {customer.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total Facturado:</span>
                            <span className="text-sm font-bold">$0</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Saldo Pendiente:</span>
                            <span className="text-sm">$0</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Última Factura:</span>
                            <span className="text-sm text-muted-foreground">N/A</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notes" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notas y Observaciones</CardTitle>
                      <CardDescription>
                        Información adicional y notas importantes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {customer.notes ? (
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap">{customer.notes}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">Sin notas</h3>
                          <p className="text-muted-foreground mb-4">
                            No hay notas adicionales para este cliente
                          </p>
                          <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Agregar Nota
                          </Button>
                        </div>
                      )}
                      
                      {customer.tags && customer.tags.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-2">Etiquetas:</h4>
                          <div className="flex flex-wrap gap-2">
                            {customer.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary">
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
      </div>
    </ErrorBoundary>
  );
}
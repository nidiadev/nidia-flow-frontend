'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Phone, Mail, MessageCircle, Calendar, FileText, CheckCircle, Clock, User, Building2 } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QueryLoading } from '@/components/ui/loading';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { interactionsApi, Interaction } from '@/lib/api/crm';
import { toast } from 'sonner';

const INTERACTION_TYPE_CONFIG = {
  call: { icon: Phone, label: 'Llamada', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  email: { icon: Mail, label: 'Email', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  meeting: { icon: Calendar, label: 'Reunión', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  note: { icon: FileText, label: 'Nota', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
  task: { icon: CheckCircle, label: 'Tarea', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
};

const OUTCOME_LABELS: Record<string, string> = {
  interested: 'Interesado',
  not_interested: 'No interesado',
  callback: 'Requiere seguimiento',
  closed: 'Cerrado',
  follow_up: 'Seguimiento',
  meeting_scheduled: 'Reunión programada',
  proposal_sent: 'Propuesta enviada',
  no_answer: 'Sin respuesta',
};

export default function InteractionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  const interactionId = params.id as string;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['interactions', interactionId],
    queryFn: async () => {
      const response = await interactionsApi.getById(interactionId);
      return response.data;
    },
  });

  const interaction = data as Interaction | undefined;

  if (isLoading) {
    return (
      <ErrorBoundary>
        <QueryLoading isLoading={true} isError={false} error={null} isEmpty={false} />
      </ErrorBoundary>
    );
  }

  if (isError || !interaction) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <SectionHeader
            title="Interacción no encontrada"
            description="La interacción que buscas no existe o fue eliminada"
            actions={
              <Button variant="outline" asChild>
                <TenantLink href={route('/crm/interactions')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </TenantLink>
              </Button>
            }
          />
        </div>
      </ErrorBoundary>
    );
  }

  const typeConfig = INTERACTION_TYPE_CONFIG[interaction.type];
  const TypeIcon = typeConfig.icon;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title={interaction.subject || `${typeConfig.label} con cliente`}
          description={`Interacción ${interaction.direction === 'inbound' ? 'entrante' : 'saliente'}`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <TenantLink href={route('/crm/interactions')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </TenantLink>
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${typeConfig.color}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {interaction.subject || `${typeConfig.label} con cliente`}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {typeConfig.label} • {interaction.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={interaction.status === 'completed' ? 'default' : interaction.status === 'scheduled' ? 'secondary' : 'destructive'}>
                    {interaction.status === 'completed' ? 'Completada' : interaction.status === 'scheduled' ? 'Programada' : 'Cancelada'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {interaction.content && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Contenido</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{interaction.content}</p>
                  </div>
                )}

                {interaction.customer && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Cliente</h4>
                    <TenantLink
                      href={route(`/crm/customers/${interaction.customerId}`)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Building2 className="h-4 w-4" />
                      <span>
                        {interaction.customer.companyName ||
                         `${interaction.customer.firstName || ''} ${interaction.customer.lastName || ''}`.trim() ||
                         'Cliente'}
                      </span>
                    </TenantLink>
                  </div>
                )}

                {interaction.outcome && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Resultado</h4>
                    <Badge variant="outline">
                      {OUTCOME_LABELS[interaction.outcome] || interaction.outcome}
                    </Badge>
                  </div>
                )}

                {interaction.nextAction && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Próxima Acción</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{interaction.nextAction}</p>
                      {interaction.nextActionDate && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(interaction.nextActionDate), 'PP', { locale: es })}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {interaction.location && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Ubicación</h4>
                    <p className="text-sm text-muted-foreground">{interaction.location}</p>
                    {interaction.locationUrl && (
                      <a
                        href={interaction.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-1 block"
                      >
                        {interaction.locationUrl}
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Estado</p>
                  <Badge variant={interaction.status === 'completed' ? 'default' : interaction.status === 'scheduled' ? 'secondary' : 'destructive'}>
                    {interaction.status === 'completed' ? 'Completada' : interaction.status === 'scheduled' ? 'Programada' : 'Cancelada'}
                  </Badge>
                </div>

                {interaction.priority && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Prioridad</p>
                    <Badge variant="outline">
                      {interaction.priority === 'low' ? 'Baja' : 
                       interaction.priority === 'normal' ? 'Normal' : 
                       interaction.priority === 'high' ? 'Alta' : 'Urgente'}
                    </Badge>
                  </div>
                )}

                {interaction.durationMinutes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Duración</p>
                    <p className="text-sm font-medium">{interaction.durationMinutes} minutos</p>
                  </div>
                )}

                {interaction.scheduledAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Programada para</p>
                    <p className="text-sm font-medium">
                      {format(new Date(interaction.scheduledAt), 'PPp', { locale: es })}
                    </p>
                  </div>
                )}

                {interaction.createdByUser && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Creada por</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {interaction.createdByUser.firstName} {interaction.createdByUser.lastName}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Creada</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {format(new Date(interaction.createdAt), 'PPp', { locale: es })}
                    </p>
                  </div>
                </div>

                {interaction.updatedAt && interaction.updatedAt !== interaction.createdAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Actualizada</p>
                    <p className="text-sm font-medium">
                      {format(new Date(interaction.updatedAt), 'PPp', { locale: es })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}


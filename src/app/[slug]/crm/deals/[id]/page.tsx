'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Edit,
  DollarSign,
  Calendar,
  User,
  Building2,
  TrendingUp,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Plus,
  FileText,
  Activity,
  Clock,
  Tag,
  Package,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageHeader } from '@/components/ui/page-header';
import { TenantLink } from '@/components/ui/tenant-link';
import { toast } from 'sonner';
import { dealsApi, Deal } from '@/lib/api/crm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dealId = params.id as string;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => dealsApi.getById(dealId),
  });

  const deal: Deal | undefined = data?.data?.data;

  const winMutation = useMutation({
    mutationFn: (data?: { notes?: string; closedAt?: string }) => dealsApi.win(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal marcado como ganado');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al marcar deal como ganado');
    },
  });

  const loseMutation = useMutation({
    mutationFn: ({ reason, notes }: { reason: string; notes?: string }) => 
      dealsApi.lose(dealId, reason, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal marcado como perdido');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al marcar deal como perdido');
    },
  });

  const handleWin = () => {
    if (confirm('¿Estás seguro de marcar este deal como ganado?')) {
      winMutation.mutate();
    }
  };

  const handleLose = () => {
    const reason = prompt('Razón de pérdida:');
    if (reason) {
      loseMutation.mutate({ reason });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      open: 'default',
      won: 'default',
      lost: 'destructive',
      abandoned: 'secondary',
    };
    const labels: Record<string, string> = {
      open: 'Abierto',
      won: 'Ganado',
      lost: 'Perdido',
      abandoned: 'Abandonado',
    };
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  return (
    <ErrorBoundary>
      <div>
        <PageHeader
          title={deal?.name || 'Detalle de Deal'}
          description="Información completa de la oportunidad"
          variant="gradient"
          actions={
            <>
              <Button variant="outline" asChild>
                <TenantLink href="/crm/pipeline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </TenantLink>
              </Button>
              {deal?.status === 'open' && (
                <>
                  <Button variant="outline" onClick={handleWin} className="text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Ganado
                  </Button>
                  <Button variant="outline" onClick={handleLose} className="text-red-600">
                    <XCircle className="h-4 w-4 mr-2" />
                    Marcar como Perdido
                  </Button>
                </>
              )}
              <Button asChild>
                <TenantLink href={`/crm/deals/${dealId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </TenantLink>
              </Button>
            </>
          }
        />

        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={!deal}
          onRetry={refetch}
        >
          {deal && (
            <div className="space-y-6">
              {/* Deal Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monto</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${deal.amount.toLocaleString()} {deal.currency || 'USD'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Valor ponderado: ${((deal.amount * deal.probability) / 100).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Probabilidad</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{deal.probability}%</div>
                    <p className="text-xs text-muted-foreground">
                      Etapa: {deal.stage?.displayName || 'N/A'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Estado</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">
                      {getStatusBadge(deal.status)}
                    </div>
                    {deal.expectedCloseDate && (
                      <p className="text-xs text-muted-foreground">
                        Cierre: {format(new Date(deal.expectedCloseDate), 'PP', { locale: es })}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Asignado a</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {deal.assignedToUser ? (
                      <>
                        <div className="text-lg font-bold">
                          {deal.assignedToUser.firstName} {deal.assignedToUser.lastName}
                        </div>
                        <p className="text-xs text-muted-foreground">{deal.assignedToUser.email}</p>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">Sin asignar</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Información Básica */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Información del Deal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Cliente</p>
                          {deal.customer ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <TenantLink 
                                href={`/crm/customers/${deal.customerId}`}
                                className="font-medium hover:underline"
                              >
                                {deal.customer.companyName || 
                                 `${deal.customer.firstName} ${deal.customer.lastName}` ||
                                 deal.customer.email}
                              </TenantLink>
                            </div>
                          ) : (
                            <p className="text-sm">N/A</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Etapa</p>
                          <div className="flex items-center gap-2">
                            {deal.stage?.color && (
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: deal.stage.color }}
                              />
                            )}
                            <span className="font-medium">{deal.stage?.displayName || 'N/A'}</span>
                          </div>
                        </div>
                        {deal.expectedCloseDate && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Fecha de Cierre Esperada
                            </p>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(new Date(deal.expectedCloseDate), 'PP', { locale: es })}
                              </span>
                            </div>
                          </div>
                        )}
                        {deal.closedAt && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Fecha de Cierre
                            </p>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(new Date(deal.closedAt), 'PPp', { locale: es })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Productos */}
                  {deal.products && deal.products.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Productos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {deal.products.map((product: any) => (
                            <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{product.product?.name || 'Producto'}</p>
                                <p className="text-sm text-muted-foreground">
                                  Cantidad: {product.quantity} × ${product.unitPrice.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">
                                  ${(product.quantity * product.unitPrice).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Notas */}
                  {deal.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Notas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                  {/* Contactos */}
                  {deal.contacts && deal.contacts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Contactos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {deal.contacts.map((contact: any) => (
                            <div key={contact.id} className="p-3 border rounded-lg">
                              <p className="font-medium">
                                {contact.contact?.firstName} {contact.contact?.lastName}
                              </p>
                              {contact.contact?.email && (
                                <p className="text-sm text-muted-foreground">{contact.contact.email}</p>
                              )}
                              {contact.contact?.phone && (
                                <p className="text-sm text-muted-foreground">{contact.contact.phone}</p>
                              )}
                              {contact.role && (
                                <Badge variant="outline" className="mt-2">{contact.role}</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tags */}
                  {deal.tags && deal.tags.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Etiquetas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {deal.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Información Adicional */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Información Adicional</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Creado</p>
                        <p>{format(new Date(deal.createdAt), 'PPp', { locale: es })}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Última actualización</p>
                        <p>{format(new Date(deal.updatedAt), 'PPp', { locale: es })}</p>
                      </div>
                      {deal.daysInStage !== undefined && (
                        <div>
                          <p className="text-muted-foreground">Días en etapa actual</p>
                          <p>{deal.daysInStage} días</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </QueryLoading>
      </div>
    </ErrorBoundary>
  );
}


'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, FileEdit, Copy, ExternalLink, BarChart3, CheckCircle, Clock } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QueryLoading } from '@/components/ui/loading';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { webFormsApi, WebForm } from '@/lib/api/crm';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function WebFormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  const formId = params.id as string;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['web-forms', formId],
    queryFn: async () => {
      const response = await webFormsApi.getById(formId);
      return response.data;
    },
  });

  const form = data as WebForm | undefined;

  const handleCopyLink = () => {
    const link = `${window.location.origin}${route(`/crm/web-forms/${formId}/embed`)}`;
    navigator.clipboard.writeText(link);
    toast.success('Enlace copiado al portapapeles');
  };

  if (isLoading) {
    return (
      <ErrorBoundary>
        <QueryLoading isLoading={true} isError={false} error={null} isEmpty={false} />
      </ErrorBoundary>
    );
  }

  if (isError || !form) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <SectionHeader
            title="Formulario no encontrado"
            description="El formulario que buscas no existe o fue eliminado"
            actions={
              <Button variant="outline" asChild>
                <TenantLink href={route('/crm/web-forms')}>
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

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title={form.name}
          description={form.description || 'Formulario web embebible'}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Enlace
              </Button>
              <Button variant="outline" asChild>
                <TenantLink href={route('/crm/web-forms')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </TenantLink>
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">{form.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant={form.isActive ? 'default' : 'secondary'}>
                    {form.isActive ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Activo
                      </>
                    ) : (
                      'Inactivo'
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Envíos</CardTitle>
                <CardDescription>
                  {form.submissionCount || 0} envíos recibidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    La visualización de envíos se implementará próximamente
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Envíos</p>
                  <p className="text-2xl font-bold">{form.submissionCount || 0}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Creado</p>
                  <p className="text-sm font-medium">
                    {format(new Date(form.createdAt), 'PP', { locale: es })}
                  </p>
                </div>

                {form.updatedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Actualizado</p>
                    <p className="text-sm font-medium">
                      {format(new Date(form.updatedAt), 'PP', { locale: es })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <TenantLink href={route(`/crm/web-forms/${formId}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </TenantLink>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={route(`/crm/web-forms/${formId}/embed`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Formulario
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}


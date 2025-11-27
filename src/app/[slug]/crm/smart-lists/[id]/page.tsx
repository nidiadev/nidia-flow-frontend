'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Users, List, RefreshCw } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QueryLoading } from '@/components/ui/loading';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { smartListsApi, SmartList } from '@/lib/api/crm';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SmartListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  const smartListId = params.id as string;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['smart-lists', smartListId],
    queryFn: async () => {
      const response = await smartListsApi.getById(smartListId);
      return response.data;
    },
  });

  const updateMembersMutation = useMutation({
    mutationFn: () => smartListsApi.update(smartListId, {}), // Trigger update
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-lists', smartListId] });
      toast.success('Miembros actualizados');
    },
  });

  const smartList = data as SmartList | undefined;

  if (isLoading) {
    return (
      <ErrorBoundary>
        <QueryLoading isLoading={true} isError={false} error={null} isEmpty={false} />
      </ErrorBoundary>
    );
  }

  if (isError || !smartList) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <SectionHeader
            title="Lista no encontrada"
            description="La lista que buscas no existe o fue eliminada"
            actions={
              <Button variant="outline" asChild>
                <TenantLink href={route('/crm/smart-lists')}>
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
          title={smartList.name}
          description={smartList.description || 'Lista inteligente de clientes'}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => updateMembersMutation.mutate()}
                disabled={updateMembersMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${updateMembersMutation.isPending ? 'animate-spin' : ''}`} />
                Actualizar Miembros
              </Button>
              <Button variant="outline" asChild>
                <TenantLink href={route('/crm/smart-lists')}>
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
                {smartList.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">{smartList.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant={smartList.isActive ? 'default' : 'secondary'}>
                    {smartList.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                  {smartList.autoUpdate && (
                    <Badge variant="outline">Auto-actualizar</Badge>
                  )}
                  <Badge variant="outline">{smartList.filterLogic}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Miembros</CardTitle>
                <CardDescription>
                  {smartList.memberCount || 0} clientes en esta lista
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    La visualización de miembros se implementará próximamente
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
                  <p className="text-xs text-muted-foreground mb-1">Miembros</p>
                  <p className="text-2xl font-bold">{smartList.memberCount || 0}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Creada</p>
                  <p className="text-sm font-medium">
                    {format(new Date(smartList.createdAt), 'PP', { locale: es })}
                  </p>
                </div>

                {smartList.updatedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Actualizada</p>
                    <p className="text-sm font-medium">
                      {format(new Date(smartList.updatedAt), 'PP', { locale: es })}
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


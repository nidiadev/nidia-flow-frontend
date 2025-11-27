'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  List,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Filter,
  Eye,
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { smartListsApi, SmartList } from '@/lib/api/crm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SmartListsPage() {
  const queryClient = useQueryClient();
  const { route } = useTenantRoutes();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['smart-lists', searchQuery],
    queryFn: async () => {
      const response = await smartListsApi.getAll({ search: searchQuery || undefined });
      return response;
    },
  });

  const smartLists = (data?.data?.data || []) as SmartList[];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => smartListsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-lists'] });
      toast.success('Lista inteligente eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar la lista');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      smartListsApi.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-lists'] });
      toast.success('Estado de la lista actualizado');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar la lista');
    },
  });

  const handleToggleActive = (list: SmartList) => {
    toggleActiveMutation.mutate({ id: list.id, isActive: !list.isActive });
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Listas Inteligentes"
          description="Segmentación dinámica de clientes con filtros avanzados"
          actions={
            <Button asChild>
              <TenantLink href={route('/crm/smart-lists/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Lista
              </TenantLink>
            </Button>
          }
        />

        {/* Search and Filters */}
        {smartLists.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar listas inteligentes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Smart Lists Grid */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={smartLists.length === 0 && !isLoading}
          onRetry={refetch}
          emptyFallback={
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
                      <rect x="40" y="40" width="60" height="50" rx="4" fill="currentColor" className="text-muted-foreground" opacity="0.2" />
                      <path d="M40 50 L40 40 L50 40 L55 45 L100 45 L100 90 L40 90 Z" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
                      <rect x="40" y="40" width="60" height="50" rx="4" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" fill="none" />
                      <rect x="110" y="50" width="50" height="40" rx="3" fill="currentColor" className="text-muted-foreground" opacity="0.15" />
                      <rect x="110" y="50" width="50" height="40" rx="3" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
                      <rect x="50" y="110" width="50" height="40" rx="3" fill="currentColor" className="text-muted-foreground" opacity="0.15" />
                      <rect x="50" y="110" width="50" height="40" rx="3" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
                      <rect x="110" y="110" width="50" height="40" rx="3" fill="currentColor" className="text-muted-foreground" opacity="0.15" />
                      <rect x="110" y="110" width="50" height="40" rx="3" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hay listas inteligentes aún</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                    Crea listas inteligentes para segmentar tus clientes automáticamente con filtros avanzados y mantener tus campañas organizadas
                  </p>
                  <Button asChild size="lg">
                    <TenantLink href={route('/crm/smart-lists/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Lista Inteligente
                    </TenantLink>
                  </Button>
                </div>
              </CardContent>
            </Card>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {smartLists.map((list: SmartList) => (
              <Card key={list.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-nidia-green">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold mb-1 truncate">
                        {list.name}
                      </CardTitle>
                      {list.description && (
                        <CardDescription className="line-clamp-2 text-xs">
                          {list.description}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <TenantLink href={route(`/crm/smart-lists/${list.id}`)} className="flex items-center">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalle
                          </TenantLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <TenantLink href={route(`/crm/smart-lists/${list.id}/edit`)} className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </TenantLink>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(list)}
                          disabled={toggleActiveMutation.isPending}
                        >
                          {list.isActive ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (confirm('¿Estás seguro de eliminar esta lista inteligente? Esta acción no se puede deshacer.')) {
                              deleteMutation.mutate(list.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Miembros</span>
                    </div>
                    <span className="text-lg font-semibold">{list.memberCount || 0}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge 
                      variant={list.isActive ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {list.isActive ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Activa
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Inactiva
                        </>
                      )}
                    </Badge>
                    {list.autoUpdate && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        Auto-actualizar
                      </Badge>
                    )}
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Filter className="h-3 w-3" />
                      {list.filterLogic || 'AND'}
                    </Badge>
                  </div>

                  {/* Last Updated */}
                  {list.updatedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Actualizada {format(new Date(list.updatedAt), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <TenantLink href={route(`/crm/smart-lists/${list.id}`)} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Miembros
                      </Button>
                    </TenantLink>
                    <TenantLink href={route(`/crm/smart-lists/${list.id}/edit`)} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </TenantLink>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </QueryLoading>
      </div>
    </ErrorBoundary>
  );
}


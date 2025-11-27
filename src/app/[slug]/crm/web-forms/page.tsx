'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileEdit,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  ExternalLink,
  BarChart3,
  Users,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { webFormsApi, WebForm } from '@/lib/api/crm';

export default function WebFormsPage() {
  const queryClient = useQueryClient();
  const { route } = useTenantRoutes();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['web-forms', searchQuery],
    queryFn: async () => {
      const response = await webFormsApi.getAll({ search: searchQuery || undefined });
      // La respuesta del API es: { success: true, data: { data: [...], pagination: {...} } }
      return response.data;
    },
  });

  const forms = (data?.data || []) as WebForm[];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => webFormsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['web-forms'] });
      toast.success('Formulario eliminado');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar el formulario');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este formulario?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}${route(`/crm/web-forms/${id}/embed`)}`;
    navigator.clipboard.writeText(link);
    toast.success('Enlace copiado al portapapeles');
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Formularios Web"
          description="Constructor de formularios embebibles para captura de leads"
          actions={
            <Button asChild>
              <TenantLink href={route('/crm/web-forms/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Formulario
              </TenantLink>
            </Button>
          }
        />

        {/* Search and Filters */}
        {forms.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar formularios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
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
          {forms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map((form) => (
                <Card key={form.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileEdit className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-base">{form.name}</CardTitle>
                        </div>
                        {form.description && (
                          <CardDescription className="text-xs mt-1">
                            {form.description}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <TenantLink href={route(`/crm/web-forms/${form.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </TenantLink>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <TenantLink href={route(`/crm/web-forms/${form.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </TenantLink>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(form.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar enlace
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={route(`/crm/web-forms/${form.id}/embed`)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Ver formulario
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(form.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BarChart3 className="h-3.5 w-3.5" />
                          <span>Envíos</span>
                        </div>
                        <span className="font-semibold">{form.submissionCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Actualizado</span>
                        </div>
                        <span className="text-xs">
                          {format(new Date(form.updatedAt), 'PP', { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
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
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                      <rect x="50" y="30" width="100" height="100" rx="4" fill="currentColor" className="text-muted-foreground" opacity="0.1" />
                      <rect x="50" y="30" width="100" height="100" rx="4" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" fill="none" />
                      <line x1="60" y1="50" x2="140" y2="50" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" />
                      <line x1="60" y1="70" x2="120" y2="70" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" />
                      <line x1="60" y1="90" x2="130" y2="90" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" />
                      <rect x="60" y="110" width="80" height="15" rx="2" fill="currentColor" className="text-muted-foreground" opacity="0.2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hay formularios aún</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
                    Crea formularios web personalizados para capturar leads y convertir visitantes en clientes potenciales
                  </p>
                  <Button asChild>
                    <TenantLink href={route('/crm/web-forms/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Formulario
                    </TenantLink>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </QueryLoading>
      </div>
    </ErrorBoundary>
  );
}


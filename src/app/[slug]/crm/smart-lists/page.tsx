'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { toast } from 'sonner';
import { smartListsApi, SmartList } from '@/lib/api/crm';

export default function SmartListsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['smart-lists', searchQuery],
    queryFn: () => smartListsApi.getAll({ search: searchQuery || undefined }),
  });

  const smartLists = data?.data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => smartListsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-lists'] });
      toast.success('Lista inteligente eliminada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar la lista');
    },
  });

  return (
    <ErrorBoundary>
      <div>
        <SectionHeader
          title="Listas Inteligentes"
          description="Segmentación dinámica de clientes con filtros avanzados"
          actions={
            <Button asChild>
              <TenantLink href="/crm/smart-lists/new">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Lista
              </TenantLink>
            </Button>
          }
        />

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar listas inteligentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Smart Lists Grid */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={smartLists.length === 0}
          onRetry={refetch}
          emptyFallback={
            <div className="text-center py-12">
              <List className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay listas inteligentes</h3>
              <p className="text-muted-foreground mb-4">
                Crea listas inteligentes para segmentar tus clientes automáticamente
              </p>
              <Button asChild>
                <TenantLink href="/crm/smart-lists/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Lista
                </TenantLink>
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {smartLists.map((list: SmartList) => (
              <Card key={list.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{list.name}</CardTitle>
                      {list.description && (
                        <p className="text-sm text-muted-foreground">{list.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <TenantLink href={`/crm/smart-lists/${list.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </TenantLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            if (confirm('¿Estás seguro de eliminar esta lista?')) {
                              deleteMutation.mutate(list.id);
                            }
                          }}
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Miembros</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{list.memberCount || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={list.isActive ? 'default' : 'secondary'}>
                        {list.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                      {list.autoUpdate && (
                        <Badge variant="outline">Auto-actualizar</Badge>
                      )}
                      <Badge variant="outline">{list.filterLogic}</Badge>
                    </div>
                    <TenantLink href={`/crm/smart-lists/${list.id}`}>
                      <Button variant="outline" className="w-full">
                        Ver Miembros
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


'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  TrendingUp,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from @/components/ui/section-header';
import { toast } from 'sonner';
import { leadScoringApi, LeadScoringRule } from '@/lib/api/crm';

export default function LeadScoringPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['lead-scoring-rules'],
    queryFn: () => leadScoringApi.getRules(),
  });

  const rules = data?.data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadScoringApi.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
      toast.success('Regla eliminada');
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: () => leadScoringApi.recalculateAll(),
    onSuccess: () => {
      toast.success('Scores recalculados para todos los clientes');
    },
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      demographic: 'bg-blue-500',
      engagement: 'bg-green-500',
      behavior: 'bg-purple-500',
      fit: 'bg-yellow-500',
      negative: 'bg-red-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <ErrorBoundary>
      <div>
        <SectionHeader
          title="Lead Scoring"
          description="Configura reglas para puntuar automáticamente tus leads"
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => recalculateMutation.mutate()}
                disabled={recalculateMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalcular Todos
              </Button>
              <Button asChild>
                <a href="/crm/lead-scoring/rules/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Regla
                </a>
              </Button>
            </>
          }
        />

        {/* Rules List */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={rules.length === 0}
          onRetry={refetch}
          emptyFallback={
            <div className="text-center py-12">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay reglas de scoring</h3>
              <p className="text-muted-foreground mb-4">
                Crea reglas para puntuar automáticamente tus leads
              </p>
              <Button asChild>
                <a href="/crm/lead-scoring/rules/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Regla
                </a>
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule: LeadScoringRule) => (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{rule.name}</CardTitle>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
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
                          <a href={`/crm/lead-scoring/rules/${rule.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            if (confirm('¿Estás seguro de eliminar esta regla?')) {
                              deleteMutation.mutate(rule.id);
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
                      <span className="text-sm text-muted-foreground">Puntos</span>
                      <Badge
                        variant={rule.points > 0 ? 'default' : 'destructive'}
                        className="text-lg"
                      >
                        {rule.points > 0 ? '+' : ''}{rule.points}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={getCategoryColor(rule.category)}
                      >
                        {rule.category}
                      </Badge>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {rule.conditions?.length || 0} condiciones
                    </div>
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


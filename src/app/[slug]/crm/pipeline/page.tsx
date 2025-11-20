'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Plus,
  TrendingUp,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageHeader } from '@/components/ui/page-header';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { toast } from 'sonner';
import { dealsApi, dealStagesApi, Deal, DealStage } from '@/lib/api/crm';
import { useRouter } from 'next/navigation';

// Pipeline metrics component
function PipelineMetrics({ deals, stages }: { deals: Deal[]; stages: DealStage[] }) {
  const metrics = useMemo(() => {
    const openDeals = deals.filter(d => d.status === 'open');
    const totalAmount = openDeals.reduce((sum, d) => sum + d.amount, 0);
    const weightedAmount = openDeals.reduce((sum, d) => sum + (d.amount * d.probability / 100), 0);
    const wonDeals = deals.filter(d => d.status === 'won');
    const lostDeals = deals.filter(d => d.status === 'lost');
    const closedDeals = wonDeals.length + lostDeals.length;
    const winRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0;

    return {
      totalDeals: openDeals.length,
      totalAmount,
      weightedAmount,
      winRate: winRate.toFixed(1),
      avgDealSize: openDeals.length > 0 ? totalAmount / openDeals.length : 0,
    };
  }, [deals]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deals Abiertos</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalDeals}</div>
          <p className="text-xs text-muted-foreground">
            En el pipeline
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${metrics.totalAmount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Valor ponderado: ${metrics.weightedAmount.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deal Promedio</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${metrics.avgDealSize.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Tamaño promedio
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.winRate}%</div>
          <p className="text-xs text-muted-foreground">
            Tasa de éxito
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Deal card component for Kanban
function DealCard({ deal, onEdit, onDelete }: { deal: Deal; onEdit: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-move">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">
              {deal.name}
            </h4>
            {deal.customer && (
              <div className="text-xs text-muted-foreground mb-1">
                {deal.customer.companyName || `${deal.customer.firstName} ${deal.customer.lastName}`}
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(deal.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(deal.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-green-600">
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como ganado
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <XCircle className="mr-2 h-4 w-4" />
                Marcar como perdido
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(deal.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              ${deal.amount.toLocaleString()} {deal.currency || 'USD'}
            </span>
            <Badge variant="outline">
              {deal.probability}%
            </Badge>
          </div>

          {deal.expectedCloseDate && (
            <div className="text-xs text-muted-foreground">
              Cierre esperado: {new Date(deal.expectedCloseDate).toLocaleDateString('es-ES')}
            </div>
          )}

          {deal.assignedToUser && (
            <div className="text-xs text-muted-foreground">
              Asignado a: {deal.assignedToUser.firstName} {deal.assignedToUser.lastName}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Pipeline column component
function PipelineColumn({ 
  stage, 
  deals,
  onDragStart,
  onDragOver,
  onDrop,
  onEdit,
  onDelete,
}: { 
  stage: DealStage;
  deals: Deal[];
  onDragStart: (e: React.DragEvent, dealId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetStageId: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const stageDeals = deals.filter(d => d.stageId === stage.id && d.status === 'open');
  const totalAmount = stageDeals.reduce((sum, d) => sum + d.amount, 0);
  const weightedAmount = stageDeals.reduce((sum, d) => sum + (d.amount * d.probability / 100), 0);

  return (
    <div 
      className="flex-1 min-w-[300px]"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {stage.color && (
                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: stage.color }}></div>
              )}
              <CardTitle className="text-base">{stage.displayName}</CardTitle>
            </div>
            <Badge variant="secondary">{stageDeals.length}</Badge>
          </div>
          <CardDescription className="text-xs">
            ${totalAmount.toLocaleString()} (${weightedAmount.toLocaleString()} ponderado)
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-400px)] overflow-y-auto">
          {stageDeals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No hay deals en esta etapa</p>
            </div>
          ) : (
            <div>
              {stageDeals.map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, deal.id)}
                >
                  <DealCard deal={deal} onEdit={onEdit} onDelete={onDelete} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isOffline } = useNetworkStatus();
  
  // Filters state
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  
  // Drag and drop state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  
  // Fetch deals and stages
  const { data: dealsData, isLoading: dealsLoading, isError: dealsError, refetch: refetchDeals } = useQuery({
    queryKey: ['deals', assignedToFilter, statusFilter],
    queryFn: () => dealsApi.getAll({
      status: statusFilter,
      assignedTo: assignedToFilter === 'me' ? 'me' : assignedToFilter === 'all' ? undefined : assignedToFilter,
    }),
  });

  const { data: stagesData, isLoading: stagesLoading } = useQuery({
    queryKey: ['deal-stages'],
    queryFn: () => dealStagesApi.getAll(),
  });

  const deals = dealsData?.data?.data || [];
  const stages = stagesData?.data?.data || [];

  // Change stage mutation
  const changeStageMutation = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      dealsApi.changeStage(dealId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Etapa del deal actualizada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar la etapa');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => dealsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal eliminado');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar el deal');
    },
  });

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    
    if (!draggedDealId) return;
    
    const deal = deals.find((d: Deal) => d.id === draggedDealId);
    if (!deal || deal.stageId === targetStageId) {
      setDraggedDealId(null);
      return;
    }
    
    changeStageMutation.mutate({ dealId: draggedDealId, stageId: targetStageId });
    setDraggedDealId(null);
  };

  const handleEdit = (id: string) => {
    router.push(`/crm/deals/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este deal?')) {
      deleteMutation.mutate(id);
    }
  };

  const isLoading = dealsLoading || stagesLoading;
  const isError = dealsError;

  return (
    <ErrorBoundary>
      <div>
        <PageHeader
          title="Pipeline de Oportunidades"
          description="Vista Kanban del pipeline de ventas"
          variant="gradient"
          actions={
            <>
              {isOffline && (
                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Modo Offline</span>
                </div>
              )}
              
              <Button asChild>
                <TenantLink href="/crm/deals/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Deal
                </TenantLink>
              </Button>
            </>
          }
        />

        {/* Metrics */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={dealsError as Error}
          isEmpty={false}
          onRetry={refetchDeals}
        >
          {deals && stages && <PipelineMetrics deals={deals} stages={stages} />}
        </QueryLoading>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los vendedores</SelectItem>
              <SelectItem value="me">Mis deals</SelectItem>
              <SelectItem value="unassigned">Sin asignar</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Abiertos</SelectItem>
              <SelectItem value="won">Ganados</SelectItem>
              <SelectItem value="lost">Perdidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Kanban Board */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={dealsError as Error}
          isEmpty={!deals || deals.length === 0}
          onRetry={refetchDeals}
          loadingFallback={
            <div className="flex gap-4 overflow-x-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 min-w-[300px]">
                  <Card>
                    <CardHeader>
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, j) => (
                          <div key={j} className="animate-pulse p-4 border rounded-lg">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          }
          emptyFallback={
            <div className="text-center py-12">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay deals en el pipeline</h3>
              <p className="text-muted-foreground mb-4">
                Comienza agregando oportunidades para iniciar tu proceso de ventas
              </p>
              <Button asChild>
                <TenantLink href="/crm/deals/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Deal
                </TenantLink>
              </Button>
            </div>
          }
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages
              .filter((s: DealStage) => s.isActive)
              .sort((a: DealStage, b: DealStage) => a.sortOrder - b.sortOrder)
              .map((stage: DealStage) => (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  deals={deals}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
          </div>
        </QueryLoading>
      </div>
    </ErrorBoundary>
  );
}

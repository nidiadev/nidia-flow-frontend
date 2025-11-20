'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  GripVertical,
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
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

// Sortable Deal Card component
function SortableDealCard({ deal, onEdit, onDelete }: { deal: Deal; onEdit: (id: string) => void; onDelete: (id: string) => void }) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on dropdown, drag handle, or buttons
    if ((e.target as HTMLElement).closest('[role="button"]') || 
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('[data-drag-handle]')) {
      return;
    }
    router.push(`/crm/deals/${deal.id}`);
  };
  
  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div 
                  {...attributes} 
                  {...listeners} 
                  data-drag-handle
                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-4 w-4" />
                </div>
                <h4 className="font-medium text-sm">
                  {deal.name}
            </h4>
              </div>
              {deal.customer && (
                <div className="text-xs text-muted-foreground mb-1 ml-6">
                  {deal.customer.companyName || 
                   `${deal.customer.firstName || ''} ${deal.customer.lastName || ''}`.trim() ||
                   deal.customer.email ||
                   'Sin cliente'}
              </div>
            )}
          </div>
          
          <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/crm/deals/${deal.id}`); }}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalle
              </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(deal.id); }}>
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
                <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(deal.id); }}>
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
    </div>
  );
}

// Pipeline column component with DnD support
function PipelineColumn({ 
  stage, 
  deals,
  onEdit,
  onDelete,
}: { 
  stage: DealStage;
  deals: Deal[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const stageDeals = deals.filter(d => d.stageId === stage.id && d.status === 'open');
  const totalAmount = stageDeals.reduce((sum, d) => sum + d.amount, 0);
  const weightedAmount = stageDeals.reduce((sum, d) => sum + (d.amount * d.probability / 100), 0);

  const dealIds = stageDeals.map(d => d.id);

  return (
    <div className="flex-1 min-w-[300px]">
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
            <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
            <div>
                {stageDeals.map((deal) => (
                  <SortableDealCard
                    key={deal.id}
                    deal={deal}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
              ))}
            </div>
            </SortableContext>
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
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch deals and stages
  const { data: dealsData, isLoading: dealsLoading, isError: dealsError, error: dealsErrorObj, refetch: refetchDeals } = useQuery({
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

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const dealId = active.id as string;
    const targetStageId = over.id as string;

    // Check if dropping on a stage (not another deal)
    const targetStage = stages.find((s: DealStage) => s.id === targetStageId);
    if (!targetStage) return;

    const deal = deals.find((d: Deal) => d.id === dealId);
    if (!deal || deal.stageId === targetStageId) return;

    changeStageMutation.mutate({ dealId, stageId: targetStageId });
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Add visual feedback during drag
  };

  const handleEdit = (id: string) => {
    router.push(`/crm/deals/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este deal?')) {
      deleteMutation.mutate(id);
    }
  };

  const activeDeal = activeId ? deals.find((d: Deal) => d.id === activeId) : null;

  const isLoading = dealsLoading || stagesLoading;
  const isError = dealsError;

  // Get all stage IDs for droppable areas
  const stageIds = stages.filter((s: DealStage) => s.isActive).map((s: DealStage) => s.id);

  return (
    <ErrorBoundary>
      <div>
        <SectionHeader
          title="Pipeline de Oportunidades"
          description="Vista Kanban del pipeline de ventas"
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
          error={dealsErrorObj}
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

        {/* Kanban Board with DnD */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={dealsErrorObj}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
              {stages
                .filter((s: DealStage) => s.isActive)
                .sort((a: DealStage, b: DealStage) => a.sortOrder - b.sortOrder)
                .map((stage: DealStage) => (
                  <div key={stage.id} id={stage.id} className="flex-1 min-w-[300px]">
              <PipelineColumn
                stage={stage}
                      deals={deals}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
            ))}
          </div>
            <DragOverlay>
              {activeDeal ? (
                <div className="opacity-90 rotate-3">
                  <Card className="w-[300px]">
                    <CardContent className="p-4">
                      <div className="font-medium text-sm mb-1">{activeDeal.name}</div>
                      <div className="text-lg font-bold">
                        ${activeDeal.amount.toLocaleString()} {activeDeal.currency || 'USD'}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </QueryLoading>
      </div>
    </ErrorBoundary>
  );
}

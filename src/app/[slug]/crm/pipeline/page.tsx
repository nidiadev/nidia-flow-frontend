'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  useDroppable,
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
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Plus,
  TrendingUp,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  GripVertical,
  Calendar,
  User,
  Building2,
  Target,
  Percent,
  Info,
  X,
  HelpCircle,
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { Deal, DealStage } from '@/lib/api/crm';
import { useDeals, useDealStages, useChangeDealStage, useDeleteDeal, useWinDeal, useLoseDeal } from '@/hooks/use-api';
import { useDealEvents } from '@/hooks/useWebSocket';
import { useRouter } from 'next/navigation';

// Pipeline metrics component - Improved UI
function PipelineMetrics({ deals, stages }: { deals: Deal[]; stages: DealStage[] }) {
  const metrics = useMemo(() => {
    const openDeals = deals.filter(d => d.status === 'open');
    const totalAmount = openDeals.reduce((sum, d) => sum + d.amount, 0);
    const weightedAmount = openDeals.reduce((sum, d) => sum + (d.amount * d.probability / 100), 0);
    const wonDeals = deals.filter(d => d.status === 'won');
    const lostDeals = deals.filter(d => d.status === 'lost');
    const closedDeals = wonDeals.length + lostDeals.length;
    const winRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0;
    const avgDealSize = openDeals.length > 0 ? totalAmount / openDeals.length : 0;

    return {
      totalDeals: openDeals.length,
      totalAmount,
      weightedAmount,
      winRate: winRate.toFixed(1),
      avgDealSize,
    };
  }, [deals]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Deals Abiertos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deals Abiertos</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalDeals.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">En el pipeline</p>
        </CardContent>
      </Card>

      {/* Valor Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.totalAmount.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Ponderado: ${metrics.weightedAmount.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Deal Promedio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deal Promedio</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.avgDealSize.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Tamaño promedio</p>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.winRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">Tasa de éxito</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Sortable Deal Card component - Trello-like drag from anywhere
function SortableDealCard({ 
  deal, 
  onEdit, 
  onDelete,
  onWin,
  onLose,
}: { 
  deal: Deal; 
  onEdit: (id: string) => void; 
  onDelete: (id: string) => void;
  onWin: (id: string) => void;
  onLose: (id: string) => void;
}) {
  const router = useRouter();
  const { route } = useTenantRoutes();
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
    // Don't navigate if clicking on dropdown or buttons
    if ((e.target as HTMLElement).closest('[role="button"]') || 
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(route(`/crm/deals/${deal.id}`));
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="mb-2"
      {...attributes}
      {...listeners}
    >
      <Card 
        className="hover:shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing border-border/50 hover:border-border group"
        onClick={handleCardClick}
      >
        <CardContent className="p-2">
          <div className="flex items-start justify-between gap-1.5 mb-1">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-xs text-foreground truncate leading-tight">
                {deal.name}
              </h4>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(route(`/crm/deals/${deal.id}`)); }} className="text-xs">
                  <Eye className="mr-2 h-3.5 w-3.5" />
                  Ver detalle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(deal.id); }} className="text-xs">
                  <Edit className="mr-2 h-3.5 w-3.5" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-xs text-green-600 dark:text-green-400"
                  onClick={(e) => { e.stopPropagation(); onWin(deal.id); }}
                >
                  <CheckCircle className="mr-2 h-3.5 w-3.5" />
                  Marcar como ganado
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-xs text-red-600 dark:text-red-400"
                  onClick={(e) => { e.stopPropagation(); onLose(deal.id); }}
                >
                  <XCircle className="mr-2 h-3.5 w-3.5" />
                  Marcar como perdido
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-xs text-red-600 dark:text-red-400" 
                  onClick={(e) => { e.stopPropagation(); onDelete(deal.id); }}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between gap-2 mt-1.5">
            <span className="text-xs font-semibold text-foreground">
              ${deal.amount.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0.5">
                {deal.probability}%
              </Badge>
              {deal.expectedCloseDate && (
                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Calendar className="h-2.5 w-2.5 flex-shrink-0" />
                  <span>{new Date(deal.expectedCloseDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                </div>
              )}
            </div>
          </div>
          
          {(deal.customer || deal.assignedToUser) && (
            <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-border/50">
              {deal.customer && (
                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground flex-1 min-w-0">
                  <Building2 className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="truncate">
                    {deal.customer.companyName || 
                     `${deal.customer.firstName || ''} ${deal.customer.lastName || ''}`.trim() ||
                     deal.customer.email ||
                     'Sin cliente'}
                  </span>
                </div>
              )}
              {deal.assignedToUser && (
                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <User className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="truncate">
                    {deal.assignedToUser.firstName} {deal.assignedToUser.lastName}
                  </span>
                </div>
              )}
            </div>
          )}
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
  onWin,
  onLose,
}: { 
  stage: DealStage;
  deals: Deal[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onWin: (id: string) => void;
  onLose: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const stageDeals = deals.filter(d => d.stageId === stage.id && d.status === 'open');
  const totalAmount = stageDeals.reduce((sum, d) => sum + d.amount, 0);
  const weightedAmount = stageDeals.reduce((sum, d) => sum + (d.amount * d.probability / 100), 0);

  const dealIds = stageDeals.map(d => d.id);

  return (
    <div ref={setNodeRef} className="flex-1 min-w-[280px]">
      <Card className={`h-full border-border/50 transition-colors ${isOver ? 'border-nidia-green/50 bg-nidia-green/5' : ''}`}>
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              {stage.color && (
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: stage.color }}
                />
              )}
              <CardTitle className="text-sm font-medium">{stage.displayName}</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs font-medium px-1.5 py-0">
              {stageDeals.length}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            ${totalAmount.toLocaleString()} <span className="text-muted-foreground/60">(${weightedAmount.toLocaleString()})</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-380px)] overflow-y-auto px-3 pb-3">
          {stageDeals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground/60">
              <p className="text-xs">No hay deals en esta etapa</p>
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
                    onWin={onWin}
                    onLose={onLose}
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
  const { route } = useTenantRoutes();
  const { isOffline } = useNetworkStatus();
  
  // Filters state
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  
  // Help drawer state
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  
  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Sensors for drag and drop - reduced activation distance for better UX
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch deals and stages using hooks
  const { data: dealsResponse, isLoading: dealsLoading, isError: dealsError, error: dealsErrorObj, refetch: refetchDeals } = useDeals({
    status: statusFilter,
    assignedTo: assignedToFilter === 'me' ? 'me' : assignedToFilter === 'all' ? undefined : assignedToFilter,
  });

  const { data: stagesResponse, isLoading: stagesLoading } = useDealStages();

  // useApiQuery already extracts data.data, so dealsResponse is already the array or { data: [], pagination: {} }
  const deals = Array.isArray(dealsResponse) ? dealsResponse : (dealsResponse?.data || []);
  const stages = stagesResponse || [];

  // Mutations
  const changeStageMutation = useChangeDealStage();
  const deleteMutation = useDeleteDeal();
  const winMutation = useWinDeal();
  const loseMutation = useLoseDeal();

  // WebSocket events for real-time updates
  useDealEvents(
    () => {
      // Deal created - refetch deals
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals', 'statistics'] });
    },
    () => {
      // Deal updated - refetch deals
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals', 'statistics'] });
    },
    () => {
      // Deal stage changed - refetch deals
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals', 'statistics'] });
    },
    () => {
      // Deal won - refetch deals
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals', 'statistics'] });
    },
    () => {
      // Deal lost - refetch deals
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals', 'statistics'] });
    }
  );

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

    changeStageMutation.mutate(
      { dealId, stageId: targetStageId },
      {
        onSuccess: async () => {
          toast.success(`Deal movido a ${targetStage.displayName}`);
          // Invalidate and refetch immediately
          await queryClient.invalidateQueries({ queryKey: ['crm', 'deals'] });
          await refetchDeals();
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Error al mover el deal');
          // Refetch on error to revert any optimistic changes
          refetchDeals();
        },
      }
    );
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    // Visual feedback is handled by isOver in PipelineColumn
  };

  const handleEdit = (id: string) => {
    router.push(route(`/crm/deals/${id}/edit`));
  };

  const handleDelete = (id: string) => {
    const deal = deals.find((d: Deal) => d.id === id);
    if (confirm(`¿Estás seguro de eliminar el deal "${deal?.name}"?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success('Deal eliminado correctamente');
        },
      });
    }
  };

  const handleWin = (id: string) => {
    const deal = deals.find((d: Deal) => d.id === id);
    if (confirm(`¿Marcar el deal "${deal?.name}" como ganado?`)) {
      winMutation.mutate(
        { dealId: id },
        {
          onSuccess: () => {
            toast.success('Deal marcado como ganado');
          },
        }
      );
    }
  };

  const handleLose = (id: string) => {
    const deal = deals.find((d: Deal) => d.id === id);
    const reason = prompt(`¿Por qué se perdió el deal "${deal?.name}"?`);
    if (reason) {
      loseMutation.mutate(
        { dealId: id, reason, notes: reason },
        {
          onSuccess: () => {
            toast.success('Deal marcado como perdido');
          },
        }
      );
    }
  };

  const activeDeal = activeId ? deals.find((d: Deal) => d.id === activeId) : null;

  const isLoading = dealsLoading || stagesLoading;
  const isError = dealsError;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Pipeline de Oportunidades"
          description="Vista Kanban del pipeline de ventas"
          actions={
            <>
              {isOffline && (
                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Modo Offline</span>
                </div>
              )}
              
              <Button asChild>
                <TenantLink href={route('/crm/deals/new')}>
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
        <div className="flex flex-col sm:flex-row gap-4">
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
                <div key={i} className="flex-1 min-w-[320px]">
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
            <div className="text-center py-16">
              <TrendingUp className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay deals en el pipeline</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Comienza agregando oportunidades para iniciar tu proceso de ventas
              </p>
              <Button asChild size="lg">
                <TenantLink href={route('/crm/deals/new')}>
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
            <div className="flex gap-3 overflow-x-auto pb-4">
              {stages
                .filter((s: DealStage) => s.isActive)
                .sort((a: DealStage, b: DealStage) => a.sortOrder - b.sortOrder)
                .map((stage: DealStage) => (
                  <PipelineColumn
                    key={stage.id}
                    stage={stage}
                    deals={deals}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onWin={handleWin}
                    onLose={handleLose}
                  />
                ))}
            </div>
            <DragOverlay>
              {activeDeal ? (
                <Card className="w-[280px] shadow-lg border-2 border-nidia-green/50">
                  <CardContent className="p-3">
                    <div className="font-medium text-sm mb-1 truncate">{activeDeal.name}</div>
                    <div className="text-base font-semibold text-foreground">
                      ${activeDeal.amount.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        </QueryLoading>

        {/* Floating Help Button */}
        <Button
          onClick={() => setShowHelpDrawer(true)}
          className="fixed bottom-4 right-4 h-10 w-10 rounded-full shadow-md hover:shadow-lg transition-all duration-200 z-50 bg-nidia-green hover:bg-nidia-green/90 text-white"
          size="sm"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* Help Drawer */}
        <Drawer open={showHelpDrawer} onOpenChange={setShowHelpDrawer} direction="right">
          <DrawerContent direction="right" className="h-full max-w-md">
            <DrawerHeader className="text-left border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-nidia-green/10 dark:bg-nidia-green/20">
                  <Info className="h-5 w-5 text-nidia-green" />
                </div>
                <div>
                  <DrawerTitle className="text-lg font-semibold">¿Qué es un Deal?</DrawerTitle>
                  <DrawerDescription className="text-xs mt-1">
                    Información sobre oportunidades de venta
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-foreground leading-relaxed mb-3">
                    Un <strong className="text-nidia-green">Deal</strong> (también conocido como oportunidad) es una potencial venta o negocio que estás 
                    siguiendo con un cliente. Cada deal representa una oportunidad de ingresos que pasa por diferentes etapas 
                    en tu pipeline de ventas, desde el primer contacto hasta el cierre.
                  </p>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-foreground leading-relaxed">
                      <strong className="text-blue-600">¿Para qué sectores aplica?</strong> Los deals son universales y aplican para 
                      <strong> cualquier sector empresarial</strong>. Ya sea que vendas productos, servicios, software, consultoría, 
                      bienes raíces, manufactura, retail, o cualquier otro tipo de negocio, el sistema de deals te ayuda a gestionar 
                      tus oportunidades de venta de manera efectiva.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Etapas del Pipeline</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Los deals se mueven entre diferentes etapas del pipeline (ej: Calificación, Propuesta, Negociación) 
                        según su progreso. Puedes arrastrar y soltar deals entre etapas para actualizar su estado.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-green-500/10 flex-shrink-0">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Valor y Probabilidad</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Cada deal tiene un monto estimado y una probabilidad de cierre (0-100%). Estos valores se combinan 
                        para calcular el <strong>valor ponderado</strong>, que es más útil para el forecasting que el valor total.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-purple-500/10 flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Forecasting</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        El pipeline te ayuda a predecir ingresos futuros y gestionar tu proceso de ventas de manera efectiva. 
                        El valor ponderado te da una estimación más realista de los ingresos esperados.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="p-2 rounded-lg bg-yellow-500/10 flex-shrink-0">
                      <Percent className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1.5 text-foreground">Win Rate</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        El Win Rate es el porcentaje de deals que se convierten en ventas exitosas. 
                        Se calcula dividiendo los deals ganados entre el total de deals cerrados (ganados + perdidos).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Tip:</strong> Arrastra los deals entre columnas para cambiar su etapa. 
                    Haz clic en un deal para ver más detalles o editarlo.
                  </p>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </ErrorBoundary>
  );
}

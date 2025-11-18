'use client';

import { useState, useMemo } from 'react';
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
  Star,
  Building2,
  Calendar,
  User,
  TrendingUp,
  DollarSign,
  Eye
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { useCustomers } from '@/hooks/use-api';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageHeader } from '@/components/ui/page-header';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { toast } from 'sonner';
import { Customer, CUSTOMER_TYPE_CONFIG, getLeadScoreInfo } from '@/types/customer';

// Pipeline stages configuration
const PIPELINE_STAGES = [
  { id: 'lead', name: 'Leads', color: 'bg-blue-500', type: 'lead' },
  { id: 'prospect', name: 'Prospectos', color: 'bg-yellow-500', type: 'prospect' },
  { id: 'active', name: 'Clientes Activos', color: 'bg-green-500', type: 'active' },
] as const;

// Filters component
function PipelineFilters({ 
  assignedToFilter, 
  setAssignedToFilter,
  dateFilter,
  setDateFilter
}: {
  assignedToFilter: string;
  setAssignedToFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filtrar por vendedor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los vendedores</SelectItem>
          <SelectItem value="me">Mis clientes</SelectItem>
          <SelectItem value="unassigned">Sin asignar</SelectItem>
        </SelectContent>
      </Select>

      <Select value={dateFilter} onValueChange={setDateFilter}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filtrar por fecha" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las fechas</SelectItem>
          <SelectItem value="today">Hoy</SelectItem>
          <SelectItem value="week">Esta semana</SelectItem>
          <SelectItem value="month">Este mes</SelectItem>
          <SelectItem value="quarter">Este trimestre</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// Pipeline metrics component
function PipelineMetrics({ customers }: { customers: Customer[] }) {
  const metrics = useMemo(() => {
    const leads = customers.filter(c => c.type === 'lead');
    const prospects = customers.filter(c => c.type === 'prospect');
    const active = customers.filter(c => c.type === 'active');
    
    const totalValue = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
    const avgLeadScore = customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.leadScore, 0) / customers.length 
      : 0;
    
    const conversionRate = leads.length > 0 
      ? ((active.length / (leads.length + prospects.length + active.length)) * 100).toFixed(1)
      : '0';

    return {
      leads: leads.length,
      prospects: prospects.length,
      active: active.length,
      totalValue,
      avgLeadScore: avgLeadScore.toFixed(0),
      conversionRate
    };
  }, [customers]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{customers.length}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.leads} leads, {metrics.prospects} prospectos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Potencial</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${metrics.totalValue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Límite de crédito total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Score Promedio</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.avgLeadScore}</div>
          <p className="text-xs text-muted-foreground">
            Calidad del pipeline
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Leads a clientes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Customer card component for Kanban
function CustomerCard({ customer }: { customer: Customer }) {
  const leadScoreInfo = getLeadScoreInfo(customer.leadScore);
  
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-move">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">
              {customer.firstName} {customer.lastName}
            </h4>
            {customer.companyName && (
              <div className="flex items-center text-xs text-muted-foreground mb-1">
                <Building2 className="h-3 w-3 mr-1" />
                {customer.companyName}
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
              <DropdownMenuItem asChild>
                <TenantLink href={`/crm/customers/${customer.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalle
                </TenantLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <TenantLink href={`/crm/customers/${customer.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </TenantLink>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Enviar email
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Phone className="mr-2 h-4 w-4" />
                Llamar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          {customer.email && (
            <div className="text-xs text-muted-foreground truncate">
              {customer.email}
            </div>
          )}
          
          {customer.phone && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Phone className="h-3 w-3 mr-1" />
              {customer.phone}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-400" />
              <span className={`text-xs font-medium ${leadScoreInfo.color}`}>
                {customer.leadScore}
              </span>
            </div>
            
            {customer.assignedToName && (
              <div className="flex items-center text-xs text-muted-foreground">
                <User className="h-3 w-3 mr-1" />
                {customer.assignedToName}
              </div>
            )}
          </div>

          {customer.lastContactAt && (
            <div className="flex items-center text-xs text-muted-foreground pt-1">
              <Calendar className="h-3 w-3 mr-1" />
              Último contacto: {new Date(customer.lastContactAt).toLocaleDateString('es-ES')}
            </div>
          )}

          {customer.tags && customer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {customer.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {customer.tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{customer.tags.length - 2}
                </Badge>
              )}
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
  customers,
  onDragStart,
  onDragOver,
  onDrop
}: { 
  stage: typeof PIPELINE_STAGES[number];
  customers: Customer[];
  onDragStart: (e: React.DragEvent, customerId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetStage: string) => void;
}) {
  const stageCustomers = customers.filter(c => c.type === stage.type);
  const totalValue = stageCustomers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);

  return (
    <div 
      className="flex-1 min-w-[300px]"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.type)}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
              <CardTitle className="text-base">{stage.name}</CardTitle>
            </div>
            <Badge variant="secondary">{stageCustomers.length}</Badge>
          </div>
          <CardDescription className="text-xs">
            Valor: ${totalValue.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-400px)] overflow-y-auto">
          {stageCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No hay clientes en esta etapa</p>
            </div>
          ) : (
            <div>
              {stageCustomers.map((customer) => (
                <div
                  key={customer.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, customer.id)}
                >
                  <CustomerCard customer={customer} />
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
  const { isOffline } = useNetworkStatus();
  
  // Filters state
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Drag and drop state
  const [draggedCustomerId, setDraggedCustomerId] = useState<string | null>(null);
  
  // Fetch customers - only leads, prospects, and active
  const { data: customers, isLoading, isError, error, refetch } = useCustomers({
    type: undefined, // Get all types, we'll filter in the UI
    sortBy: 'leadScore',
    sortOrder: 'desc',
  });

  // Filter customers for pipeline (only lead, prospect, active)
  const pipelineCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter((c: Customer) => 
      ['lead', 'prospect', 'active'].includes(c.type)
    );
  }, [customers]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, customerId: string) => {
    setDraggedCustomerId(customerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    
    if (!draggedCustomerId) return;
    
    // Find the customer
    const customer = pipelineCustomers.find((c: Customer) => c.id === draggedCustomerId);
    
    if (!customer) return;
    
    // Check if stage changed
    if (customer.type === targetStage) {
      setDraggedCustomerId(null);
      return;
    }
    
    // TODO: Call API to update customer type
    toast.success(`Cliente movido a ${PIPELINE_STAGES.find(s => s.type === targetStage)?.name}`);
    
    setDraggedCustomerId(null);
    
    // Refetch to update the UI
    refetch();
  };

  return (
    <ErrorBoundary>
      <div>
        <PageHeader
          title="Pipeline de Ventas"
          description="Vista Kanban del proceso de ventas"
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
                <TenantLink href="/crm/customers/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Lead
                </TenantLink>
              </Button>
            </>
          }
        />

        {/* Metrics */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={false}
          onRetry={refetch}
        >
          {pipelineCustomers && <PipelineMetrics customers={pipelineCustomers} />}
        </QueryLoading>

        {/* Filters */}
        <PipelineFilters
          assignedToFilter={assignedToFilter}
          setAssignedToFilter={setAssignedToFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />

        {/* Kanban Board */}
        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={!pipelineCustomers || pipelineCustomers.length === 0}
          onRetry={refetch}
          loadingFallback={
            <div className="flex gap-4 overflow-x-auto">
              {PIPELINE_STAGES.map((stage) => (
                <div key={stage.id} className="flex-1 min-w-[300px]">
                  <Card>
                    <CardHeader>
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="animate-pulse p-4 border rounded-lg">
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
              <h3 className="text-lg font-medium mb-2">No hay clientes en el pipeline</h3>
              <p className="text-muted-foreground mb-4">
                Comienza agregando leads para iniciar tu proceso de ventas
              </p>
              <Button asChild>
                <TenantLink href="/crm/customers/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Lead
                </TenantLink>
              </Button>
            </div>
          }
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                customers={pipelineCustomers || []}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </QueryLoading>
      </div>
    </ErrorBoundary>
  );
}

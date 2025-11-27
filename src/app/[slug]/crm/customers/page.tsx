'use client';

import { useState, useMemo, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Download,
  Star,
  Building2,
  Calendar,
  MapPin,
  Eye,
  Users,
  UserPlus,
  TrendingUp,
  Target
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { useRouter } from 'next/navigation';
import { useCustomersWithPagination, useDeleteCustomer, useCustomerStatistics } from '@/hooks/use-api';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';
import { Customer, CUSTOMER_TYPE_CONFIG, getLeadScoreInfo } from '@/types/customer';
import { CustomerExport } from '@/components/crm/customer-export';
import { SectionHeader } from '@/components/ui/section-header';
import { CustomerCard } from '@/components/crm/customer-card';
import { Table } from '@/components/table';
import { TableRowAction } from '@/components/table/types';

// Define columns for DataTable
function getColumns(): ColumnDef<Customer>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Cliente',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center space-x-3 group">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-nidia-green/80 to-nidia-purple/80 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm group-hover:shadow-md transition-shadow">
                {customer.firstName?.[0]}{customer.lastName?.[0]}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-foreground group-hover:text-nidia-green transition-colors">
                {customer.firstName} {customer.lastName}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {customer.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'info',
      header: 'Información',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="space-y-2">
            {customer.companyName && (
              <div className="flex items-center gap-1.5 text-sm">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-foreground font-medium truncate">{customer.companyName}</span>
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              {customer.whatsapp && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{customer.whatsapp.replace(/^\+57\s?/, '')}</span>
                </div>
              )}
              {customer.city && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{customer.city}</span>
                </div>
              )}
            </div>
            {customer.tags && customer.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {customer.tags.slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5 h-5 bg-muted/60 hover:bg-muted border-border/50 text-foreground/80 font-medium"
                  >
                    {tag}
                  </Badge>
                ))}
                {customer.tags.length > 3 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-0.5 h-5 text-muted-foreground border-border/50"
                  >
                    +{customer.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const typeConfig = CUSTOMER_TYPE_CONFIG[row.original.type];
        return (
          <Badge 
            variant={typeConfig.variant}
            className={`${typeConfig.color} text-xs font-medium px-2.5 py-0.5`}
          >
            {typeConfig.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'leadScore',
      header: 'Score',
      cell: ({ row }) => {
        const customer = row.original;
        const leadScoreInfo = getLeadScoreInfo(customer.leadScore);
        return (
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className={`${leadScoreInfo.color} font-semibold text-sm`}>
              {customer.leadScore}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'assignedTo',
      header: 'Asignado a',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.assignedToName || row.original.assignedTo || (
            <span className="text-muted-foreground/60 italic">Sin asignar</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'dates',
      header: 'Fechas',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">
              {new Date(customer.createdAt).toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })}
            </div>
            {customer.lastContactAt && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Último: {new Date(customer.lastContactAt).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: '2-digit' 
                })}</span>
              </div>
            )}
          </div>
        );
      },
    },
  ];
}

export default function CustomersListPage() {
  const { isOffline } = useNetworkStatus();
  const { hasPermission } = usePermissions();
  const router = useRouter();
  
  // Filters state
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Define columns
  const columns = useMemo(() => getColumns(), []);
  
  // Get tenant routes helper
  const { route } = useTenantRoutes();
  
  // Build filters for API
  const filters = useMemo(() => ({
    type: typeFilter !== 'all' ? typeFilter : undefined,
    sortBy,
    sortOrder,
    page: currentPage,
    limit: itemsPerPage,
  }), [typeFilter, sortBy, sortOrder, currentPage]);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, sortBy, sortOrder]);
  
  // Fetch customers with pagination
  const { data: customersData, isLoading, isError, error, refetch } = useCustomersWithPagination(filters);
  const customers = customersData?.data || [];
  const pagination = customersData?.pagination;
  
  // Fetch statistics
  const { data: statistics } = useCustomerStatistics();
  
  // Delete customer mutation
  const deleteCustomer = useDeleteCustomer();
  
  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer.mutateAsync(id);
      toast.success('Cliente eliminado correctamente');
      refetch();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  // Stats data
  const statsData = useMemo(() => {
    const total = statistics?.totalCustomers || 0;
    const leads = statistics?.byType?.lead || 0;
    const prospects = statistics?.byType?.prospect || 0;
    const active = statistics?.byType?.active || 0;
    const conversionRate = statistics?.conversionRate || 0;
    const avgScore = Math.round(statistics?.averageLeadScore || 0);
    
    return [
      {
        label: 'Clientes',
        value: total,
        description: `${active} activos`,
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
      },
      {
        label: 'Leads y Prospectos',
        value: leads + prospects,
        description: `${leads} leads, ${prospects} prospectos`,
        icon: <UserPlus className="h-4 w-4 text-blue-500" />,
      },
      {
        label: 'Tasa Conversión',
        value: `${conversionRate.toFixed(1)}%`,
        description: 'Leads a clientes activos',
        icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      },
      {
        label: 'Score Promedio',
        value: avgScore,
        description: 'Calidad promedio de leads',
        icon: <Target className="h-4 w-4 text-yellow-500" />,
      },
    ];
  }, [statistics]);

  // Row actions
  const rowActions: TableRowAction<Customer>[] = useMemo(() => [
    {
      label: 'Ver detalle',
      icon: <Eye className="h-4 w-4" />,
      onClick: (customer) => {
        router.push(route(`/crm/customers/${customer.id}`));
      },
      requiredPermission: ['crm:read', 'crm:customers:read'],
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: (customer) => {
        router.push(route(`/crm/customers/${customer.id}/edit`));
      },
      requiredPermission: ['crm:write', 'crm:customers:write'],
    },
    {
      label: 'Enviar email',
      icon: <Mail className="h-4 w-4" />,
      onClick: () => {
        toast.info('Función de email próximamente');
      },
      requiredPermission: ['crm:write', 'crm:customers:write'],
    },
    {
      label: 'Llamar',
      icon: <Phone className="h-4 w-4" />,
      onClick: () => {
        toast.info('Función de llamada próximamente');
      },
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      separator: true,
      onClick: (customer) => {
        if (confirm(`¿Estás seguro de que deseas eliminar a ${customer.firstName} ${customer.lastName}?`)) {
          handleDelete(customer.id);
        }
      },
      requiredPermission: ['crm:delete', 'crm:customers:delete'],
    },
  ], [route, router]);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        {/* Header */}
        <SectionHeader
          title="Clientes"
          description="Gestiona y organiza tu base de clientes y leads"
          actions={
            isOffline ? (
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-3 py-1.5 rounded-md text-xs font-medium">
                <div className="w-1.5 h-1.5 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
                <span>Offline</span>
              </div>
            ) : null
          }
        />

        {/* Tabla con componente global - Stats integradas */}
        <Table
          id="customers"
          data={customers}
          columns={columns}
          search={{
            enabled: true,
            placeholder: 'Buscar por nombre, email, empresa...',
          }}
          pagination={{
            enabled: true,
            pageSize: itemsPerPage,
            serverSide: true,
            total: pagination?.total,
            onPageChange: (newPage) => setCurrentPage(newPage),
          }}
          rowActions={rowActions}
          actions={[
            {
              label: 'Exportar',
              icon: <Download className="h-4 w-4" />,
              variant: 'outline',
              render: () => (
                <CustomerExport 
                  customers={customers || []}
                  trigger={
                    <Button variant="outline" size="default">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  }
                />
              ),
            },
            ...(hasPermission('crm:write') || hasPermission('crm:customers:write') ? [{
              label: 'Nuevo Cliente',
              icon: <Plus className="h-4 w-4" />,
              onClick: () => router.push(route('/crm/customers/new')),
            }] : []),
          ]}
          stats={{
            enabled: true,
            stats: statsData,
          }}
          cards={{
            enabled: true,
            gridCols: { default: 1, sm: 2, lg: 3, xl: 4 },
            renderCard: (customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                viewUrl={route(`/crm/customers/${customer.id}`)}
                editUrl={route(`/crm/customers/${customer.id}/edit`)}
                onDelete={(id) => {
                  if (confirm(`¿Estás seguro de que deseas eliminar a ${customer.firstName} ${customer.lastName}?`)) {
                    handleDelete(id);
                  }
                }}
              />
            ),
          }}
          emptyState={{
            icon: <Users className="h-16 w-16 text-muted-foreground/50" />,
            title: typeFilter !== 'all' 
              ? 'No se encontraron clientes'
              : 'No hay clientes',
            description: typeFilter !== 'all' 
              ? 'Intenta ajustar los filtros para encontrar más resultados'
              : 'Comienza agregando tu primer cliente para gestionar tu base de contactos',
            action: (hasPermission('crm:write') || hasPermission('crm:customers:write')) ? (
              <Button asChild>
                <TenantLink href={route('/crm/customers/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Cliente
                </TenantLink>
              </Button>
            ) : undefined,
          }}
          isLoading={isLoading}
          isError={isError}
          error={error as Error | null}
          onRetry={refetch}
          features={{
            columnVisibility: true,
            columnSizing: true,
          }}
          getRowId={(row) => row.id}
          onRowClick={(customer) => {
            router.push(route(`/crm/customers/${customer.id}`));
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

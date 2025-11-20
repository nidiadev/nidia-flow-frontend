'use client';

import { useState, useMemo, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Download,
  UserPlus,
  Users,
  Star,
  Building2,
  Calendar,
  MapPin,
  Eye
} from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { useRouter } from 'next/navigation';
import { useCustomersWithPagination, useDeleteCustomer } from '@/hooks/use-api';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';
import { Customer, CUSTOMER_TYPE_CONFIG, getLeadScoreInfo } from '@/types/customer';
import { CustomerStats } from '@/components/crm/customer-stats';
import { CustomerExport } from '@/components/crm/customer-export';
import { SectionHeader } from '@/components/ui/section-header';
import { DataTable, DataTableAction } from '@/components/ui/data-table';

// Filters component
function CustomerFilters({ 
  searchTerm, 
  setSearchTerm, 
  typeFilter, 
  setTypeFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder 
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por nombre, email, empresa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Todos los tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="lead">Leads</SelectItem>
          <SelectItem value="prospect">Prospectos</SelectItem>
          <SelectItem value="active">Activos</SelectItem>
          <SelectItem value="inactive">Inactivos</SelectItem>
          <SelectItem value="churned">Perdidos</SelectItem>
        </SelectContent>
      </Select>

      <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value: string) => {
        const [field, order] = value.split('-');
        setSortBy(field);
        setSortOrder(order);
      }}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Más recientes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt-desc">Más recientes</SelectItem>
          <SelectItem value="createdAt-asc">Más antiguos</SelectItem>
          <SelectItem value="firstName-asc">Nombre A-Z</SelectItem>
          <SelectItem value="firstName-desc">Nombre Z-A</SelectItem>
          <SelectItem value="leadScore-desc">Score mayor</SelectItem>
          <SelectItem value="leadScore-asc">Score menor</SelectItem>
          <SelectItem value="lastContactAt-desc">Último contacto</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// Bulk actions component
function BulkActions({ 
  selectedCustomers, 
  onClearSelection,
  allCustomers
}: { 
  selectedCustomers: Customer[]; 
  onClearSelection: () => void;
  allCustomers: Customer[];
}) {
  const handleBulkAction = (action: string) => {
    toast.info(`Acción "${action}" aplicada a ${selectedCustomers.length} cliente${selectedCustomers.length !== 1 ? 's' : ''}`);
    onClearSelection();
  };

  if (selectedCustomers.length === 0) return null;

  return (
    <div className="flex items-center justify-between bg-muted p-4 rounded-lg mb-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCustomers.length} cliente{selectedCustomers.length !== 1 ? 's' : ''} seleccionado{selectedCustomers.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('Asignar vendedor')}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Asignar
        </Button>
        
        <CustomerExport 
          customers={allCustomers}
          selectedCustomers={selectedCustomers.map(c => c.id)}
          trigger={
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          }
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('Cambiar tipo')}
        >
          <Users className="h-4 w-4 mr-2" />
          Cambiar tipo
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// Define columns for DataTable
function getColumns(): ColumnDef<Customer>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Cliente',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-nidia-green to-nidia-purple rounded-full flex items-center justify-center text-white text-sm font-medium">
                {customer.firstName?.[0]}{customer.lastName?.[0]}
              </div>
            </div>
            <div>
              <div className="font-medium text-foreground">
                {customer.firstName} {customer.lastName}
              </div>
              <div className="text-sm text-muted-foreground">
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
          <div className="space-y-1">
            {customer.companyName && (
              <div className="flex items-center text-sm">
                <Building2 className="h-3 w-3 mr-1 text-muted-foreground" />
                {customer.companyName}
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-3 w-3 mr-1" />
                {customer.phone}
              </div>
            )}
            {customer.city && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                {customer.city}
              </div>
            )}
            {customer.tags && customer.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
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
            className={typeConfig.color}
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
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-400" />
            <span className={`${leadScoreInfo.color} font-medium`}>
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
          {row.original.assignedToName || row.original.assignedTo || 'Sin asignar'}
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
            <div className="text-sm">
              {new Date(customer.createdAt).toLocaleDateString('es-ES')}
            </div>
            {customer.lastContactAt && (
              <div className="text-xs text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Último: {new Date(customer.lastContactAt).toLocaleDateString('es-ES')}
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
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Selection state
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  
  // Define columns
  const columns = useMemo(() => getColumns(), []);
  
  // Build filters for API
  const filters = useMemo(() => ({
    search: searchTerm || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    sortBy,
    sortOrder,
    page: currentPage,
    limit: itemsPerPage,
  }), [searchTerm, typeFilter, sortBy, sortOrder, currentPage]);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, sortBy, sortOrder]);
  
  // Fetch customers with pagination
  const { data: customersData, isLoading, isError, error, refetch } = useCustomersWithPagination(filters);
  const customers = customersData?.data || [];
  const pagination = customersData?.pagination;
  
  // Delete customer mutation
  const deleteCustomer = useDeleteCustomer();
  
  // Handle row selection from DataTable
  const handleRowSelectionChange = (selectedRows: Customer[]) => {
    setSelectedCustomers(selectedRows);
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer.mutateAsync(id);
      toast.success('Cliente eliminado correctamente');
      refetch();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <ErrorBoundary>
      <div>
        {/* Header */}
        <SectionHeader
          title="Lista de Clientes"
          description="Gestiona y organiza tu base de clientes y leads"
          actions={
            <>
              {isOffline && (
                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Modo Offline</span>
                </div>
              )}
              
              <CustomerExport 
                customers={customers || []}
                trigger={
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                }
              />
              
              {hasPermission('crm:write') || hasPermission('crm:customers:write') ? (
                <Button asChild>
                  <TenantLink href="/crm/customers/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Cliente
                  </TenantLink>
                </Button>
              ) : null}
            </>
          }
        />

        {/* Stats */}
        <CustomerStats className="mb-6" />

        {/* Filters and Table Section */}
        <div className="space-y-4">
          {/* Filters */}
          <CustomerFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedCustomers={selectedCustomers}
            onClearSelection={() => setSelectedCustomers([])}
            allCustomers={customers || []}
          />

          {/* Table - Sin Card wrapper */}
          <div className="rounded-lg border bg-card">
            {/* Table Header */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Clientes</h3>
                  <p className="text-sm text-muted-foreground">
                    {pagination 
                      ? `${pagination.total} cliente${pagination.total !== 1 ? 's' : ''} en total`
                      : isLoading 
                        ? 'Cargando clientes...' 
                        : 'No hay clientes'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="p-6">
              {isOffline && (
                <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center text-orange-800 dark:text-orange-200">
                    <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm font-medium">
                      Modo offline - Mostrando datos en caché
                    </span>
                  </div>
                </div>
              )}
              
              <DataTable
              data={customers || []}
              columns={columns}
              searchPlaceholder="Buscar por nombre, email, empresa..."
              emptyMessage={
                searchTerm || typeFilter !== 'all' 
                  ? 'No se encontraron clientes'
                  : 'No hay clientes'
              }
              emptyDescription={
                searchTerm || typeFilter !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda para encontrar más resultados'
                  : 'Comienza agregando tu primer cliente para gestionar tu base de contactos'
              }
              isLoading={isLoading}
              showSearch={false}
              actions={[
                {
                  label: 'Ver detalle',
                  icon: <Eye className="h-4 w-4" />,
                  onClick: (customer) => {
                    router.push(`/crm/customers/${customer.id}`);
                  },
                  requiredPermission: ['crm:read', 'crm:customers:read'],
                },
                {
                  label: 'Editar',
                  icon: <Edit className="h-4 w-4" />,
                  onClick: (customer) => {
                    router.push(`/crm/customers/${customer.id}/edit`);
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
              ]}
              enableRowSelection={true}
              onRowSelectionChange={handleRowSelectionChange}
              enableColumnVisibility={true}
              enableColumnSizing={true}
              getRowId={(row) => row.id}
              onRowClick={(customer) => {
                router.push(`/crm/customers/${customer.id}`);
              }}
            />
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} clientes
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={pagination.page === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
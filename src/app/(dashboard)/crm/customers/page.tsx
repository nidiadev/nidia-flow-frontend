'use client';

import { useState, useMemo, useEffect } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  MoreHorizontal, 
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
import Link from 'next/link';
import { useCustomers } from '@/hooks/use-api';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useCustomerEvents } from '@/hooks/useWebSocket';
import { toast } from 'sonner';
import { Customer, CUSTOMER_TYPE_CONFIG, getLeadScoreInfo } from '@/types/customer';
import { CustomerStats } from '@/components/crm/customer-stats';
import { CustomerExport } from '@/components/crm/customer-export';
import { useViewMode } from '@/hooks/use-view-mode';
import { ViewToggle } from '@/components/ui/view-toggle';
import { CustomerCard } from '@/components/crm/customer-card';

// Filters component
function CustomerFilters({ 
  searchTerm, 
  setSearchTerm, 
  typeFilter, 
  setTypeFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
  viewMode: 'table' | 'cards';
  setViewMode: (mode: 'table' | 'cards') => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex gap-3 flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, email, empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>
      
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Tipo de cliente" />
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
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Ordenar por" />
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
// Customer row component
function CustomerRow({ 
  customer
}: { 
  customer: Customer; 
}) {
  const typeConfig = CUSTOMER_TYPE_CONFIG[customer.type];
  const leadScoreInfo = getLeadScoreInfo(customer.leadScore);
  
  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="py-4">
        <Link href={`/crm/customers/${customer.id}`} className="flex items-center space-x-3 group">
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
        </Link>
      </TableCell>
      
      <TableCell className="py-4">
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
      </TableCell>
      
      <TableCell className="py-4">
        <Badge 
          variant={typeConfig.variant}
          className={`${typeConfig.color} text-xs font-medium px-2.5 py-0.5`}
        >
          {typeConfig.label}
        </Badge>
      </TableCell>
      
      <TableCell className="py-4">
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className={`${leadScoreInfo.color} font-semibold text-sm`}>
            {customer.leadScore}
          </span>
        </div>
      </TableCell>
      
      <TableCell className="py-4">
        <div className="text-sm text-muted-foreground">
          {customer.assignedToName || customer.assignedTo || (
            <span className="text-muted-foreground/60 italic">Sin asignar</span>
          )}
        </div>
      </TableCell>
      
      <TableCell className="py-4">
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
      </TableCell>
      
      <TableCell className="py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/crm/customers/${customer.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/crm/customers/${customer.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
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
      </TableCell>
    </TableRow>
  );
}

export default function CustomersListPage() {
  const { isOffline } = useNetworkStatus();
  
  // View mode state
  const { viewMode, setViewMode, isTableView, isCardsView } = useViewMode('customers-view-mode', 'table');
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Selection state
  
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
  
  // Fetch customers
  const { data: customers, isLoading, isError, error, refetch } = useCustomers(filters);
  
  // Listen to customer events for real-time updates
  useCustomerEvents(
    (customer) => {
      // When a new customer is created, refetch the list if we're on the first page
      // or if the customer matches current filters
      if (currentPage === 1) {
        refetch();
    }
    },
    (customer) => {
      // When a customer is updated, refetch the list
      refetch();
    },
    (customer) => {
      // When customer status changes, refetch the list
      refetch();
    }
  );
  

  return (
    <ErrorBoundary>
ó       <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-outfit bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">
              Clientes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona y organiza tu base de clientes y leads
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {isOffline && (
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-3 py-1.5 rounded-md text-xs font-medium">
                <div className="w-1.5 h-1.5 bg-orange-600 dark:bg-orange-400 rounded-full animate-pulse"></div>
                <span>Offline</span>
              </div>
            )}
            
            <CustomerExport 
              customers={customers || []}
              trigger={
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              }
            />
            
            <Button asChild size="sm">
              <Link href="/crm/customers/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <CustomerStats />

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
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Bulk Actions */}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isOffline && (
              <div className="p-4 border-b bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                <div className="flex items-center text-orange-800 dark:text-orange-200">
                  <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm font-medium">
                    Modo offline - Mostrando datos en caché
                  </span>
                </div>
              </div>
            )}
            
            <QueryLoading
              isLoading={isLoading}
              isError={isError}
              error={error as Error}
              isEmpty={!customers || customers.length === 0}
              onRetry={refetch}
              loadingFallback={
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-4 h-4 bg-muted rounded"></div>
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                      </div>
                      <div className="w-20 h-6 bg-muted rounded"></div>
                      <div className="w-12 h-4 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              }
              emptyFallback={
                <div className="text-center py-16 px-6">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay clientes</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {searchTerm || typeFilter !== 'all' 
                      ? 'No se encontraron clientes con los filtros aplicados'
                      : 'Comienza agregando tu primer cliente'
                    }
                  </p>
                  <Button asChild>
                    <Link href="/crm/customers/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Cliente
                    </Link>
                  </Button>
                </div>
              }
            >
              {isTableView ? (
                <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                      <TableRow className="border-b border-border/50">
                        <TableHead className="font-semibold text-foreground">Cliente</TableHead>
                        <TableHead className="font-semibold text-foreground">Información</TableHead>
                        <TableHead className="font-semibold text-foreground">Tipo</TableHead>
                        <TableHead className="font-semibold text-foreground">Score</TableHead>
                        <TableHead className="font-semibold text-foreground">Asignado a</TableHead>
                        <TableHead className="font-semibold text-foreground">Fechas</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers?.map((customer: Customer) => (
                    <CustomerRow
                      key={customer.id}
                      customer={customer}
                    />
                  ))}
                </TableBody>
              </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
                  {customers?.map((customer: Customer) => (
                    <CustomerCard
                      key={customer.id}
                      customer={customer}
                      viewUrl={`/crm/customers/${customer.id}`}
                      editUrl={`/crm/customers/${customer.id}/edit`}
                    />
                  ))}
                </div>
              )}
              
              {/* Pagination Footer - Compact and integrated */}
        {customers && customers.length > 0 && (
                <div className="border-t px-6 py-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, customers.length)} de {customers.length} cliente{customers.length !== 1 ? 's' : ''}
                  </div>
                  
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                      {/* Page numbers - show max 5 pages */}
                {Array.from({ length: Math.min(5, Math.ceil(customers.length / itemsPerPage)) }, (_, i) => {
                  const pageNum = i + 1;
                        const totalPages = Math.ceil(customers.length / itemsPerPage);
                        
                        // Show first page, last page, current page, and pages around current
                        if (totalPages <= 5 || pageNum === 1 || pageNum === totalPages || 
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                        }
                        
                        // Show ellipsis
                        if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return (
                            <PaginationItem key={`ellipsis-${pageNum}`}>
                              <span className="px-2">...</span>
                            </PaginationItem>
                          );
                        }
                        
                        return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                          onClick={() => setCurrentPage(prev => {
                            const totalPages = Math.ceil(customers.length / itemsPerPage);
                            return Math.min(totalPages, prev + 1);
                          })}
                          className={currentPage >= Math.ceil(customers.length / itemsPerPage) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
            </QueryLoading>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
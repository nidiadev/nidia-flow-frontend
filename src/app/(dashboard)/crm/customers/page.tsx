'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { toast } from 'sonner';
import { Customer, CUSTOMER_TYPE_CONFIG, getLeadScoreInfo } from '@/types/customer';
import { CustomerStats } from '@/components/crm/customer-stats';
import { CustomerExport } from '@/components/crm/customer-export';

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
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
function BulkActions({ 
  selectedCustomers, 
  onClearSelection,
  customers
}: { 
  selectedCustomers: string[]; 
  onClearSelection: () => void;
  customers: Customer[];
}) {
  const handleBulkAction = (action: string) => {
    toast.info(`Acción "${action}" aplicada a ${selectedCustomers.length} clientes`);
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
          customers={customers}
          selectedCustomers={selectedCustomers}
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

// Customer row component
function CustomerRow({ 
  customer, 
  isSelected, 
  onSelect 
}: { 
  customer: Customer; 
  isSelected: boolean; 
  onSelect: (id: string, selected: boolean) => void; 
}) {
  const typeConfig = CUSTOMER_TYPE_CONFIG[customer.type];
  const leadScoreInfo = getLeadScoreInfo(customer.leadScore);
  
  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked: boolean) => onSelect(customer.id, !!checked)}
        />
      </TableCell>
      
      <TableCell>
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
      </TableCell>
      
      <TableCell>
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
      </TableCell>
      
      <TableCell>
        <Badge 
          variant={typeConfig.variant}
          className={typeConfig.color}
        >
          {typeConfig.label}
        </Badge>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-1">
          <Star className="h-3 w-3 text-yellow-400" />
          <span className={`${leadScoreInfo.color} font-medium`}>
            {customer.leadScore}
          </span>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {customer.assignedToName || customer.assignedTo || 'Sin asignar'}
        </div>
      </TableCell>
      
      <TableCell>
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
      </TableCell>
      
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
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
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Selection state
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  
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
  
  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked && customers) {
      setSelectedCustomers(customers.map((c: Customer) => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };
  
  const handleSelectCustomer = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedCustomers(prev => [...prev, id]);
    } else {
      setSelectedCustomers(prev => prev.filter(cid => cid !== id));
    }
  };
  
  const isAllSelected = customers && customers.length > 0 && selectedCustomers.length === customers.length;
  const isIndeterminate = selectedCustomers.length > 0 && selectedCustomers.length < (customers?.length || 0);

  return (
    <ErrorBoundary>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">
              Lista de Clientes
            </h1>
            <p className="text-muted-foreground">
              Gestiona y organiza tu base de clientes y leads
            </p>
          </div>
          
          <div className="flex items-center gap-3">
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
            
            <Button asChild>
              <Link href="/crm/customers/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <CustomerStats className="mb-8" />

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
          customers={customers || []}
        />

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>
              {customers ? `${customers.length} cliente${customers.length !== 1 ? 's' : ''} encontrado${customers.length !== 1 ? 's' : ''}` : 'Cargando clientes...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isOffline && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center text-orange-800">
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
                <div className="space-y-3">
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
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay clientes</h3>
                  <p className="text-muted-foreground mb-4">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        // @ts-ignore - indeterminate is a valid prop
                        indeterminate={isIndeterminate}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Información</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Asignado a</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers?.map((customer: Customer) => (
                    <CustomerRow
                      key={customer.id}
                      customer={customer}
                      isSelected={selectedCustomers.includes(customer.id)}
                      onSelect={handleSelectCustomer}
                    />
                  ))}
                </TableBody>
              </Table>
            </QueryLoading>
          </CardContent>
        </Card>

        {/* Pagination */}
        {customers && customers.length > 0 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {/* Page numbers - simplified for now */}
                {Array.from({ length: Math.min(5, Math.ceil(customers.length / itemsPerPage)) }, (_, i) => {
                  const pageNum = i + 1;
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
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className={customers.length < itemsPerPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
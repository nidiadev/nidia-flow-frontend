'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
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
  Mail, 
  Phone,
  Building2,
  Star,
  User,
  Briefcase,
} from 'lucide-react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerContacts } from '@/hooks/use-api';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { DataTable } from '@/components/ui/data-table';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';

interface CustomerContact {
  id: string;
  firstName: string;
  lastName?: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  customerId: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Filters component
function ContactFilters({ 
  searchTerm, 
  setSearchTerm,
  includeInactive,
  setIncludeInactive,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  includeInactive: boolean;
  setIncludeInactive: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por nombre, email, teléfono, cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select 
        value={includeInactive ? 'all' : 'active'} 
        onValueChange={(value) => setIncludeInactive(value === 'all')}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Solo activos</SelectItem>
          <SelectItem value="all">Todos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// Define columns for DataTable
function getColumns(route: (path: string) => string): ColumnDef<CustomerContact>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Contacto',
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex items-center space-x-3 group">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-nidia-green/80 to-nidia-purple/80 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm group-hover:shadow-md transition-shadow">
                {contact.firstName?.[0]}{contact.lastName?.[0] || ''}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-foreground group-hover:text-nidia-green transition-colors">
                {contact.firstName} {contact.lastName || ''}
              </div>
              {contact.position && (
                <div className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3" />
                  {contact.position}
                </div>
              )}
            </div>
            {contact.isPrimary && (
              <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Principal
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'customer',
      header: 'Cliente',
      cell: ({ row }) => {
        const contact = row.original;
        const customer = contact.customer;
        if (!customer) return <span className="text-muted-foreground">-</span>;
        
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-foreground truncate">
                {customer.companyName || `${customer.firstName} ${customer.lastName}`}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {customer.firstName} {customer.lastName}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'contact',
      header: 'Información de Contacto',
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="space-y-1 min-w-0">
            {contact.email && (
              <div className="flex items-center gap-1.5 text-sm text-foreground truncate">
                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {(contact.phone || contact.mobile) && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{contact.mobile || contact.phone}</span>
              </div>
            )}
            {!contact.email && !contact.phone && !contact.mobile && (
              <span className="text-sm text-muted-foreground">Sin información</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'department',
      header: 'Departamento',
      cell: ({ row }) => {
        const contact = row.original;
        return contact.department ? (
          <span className="text-sm text-foreground">{contact.department}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <Badge 
            variant={contact.isActive ? 'default' : 'secondary'}
            className={contact.isActive 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
            }
          >
            {contact.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
  ];
}

export default function CustomerContactsPage() {
  const router = useRouter();
  const { route } = useTenantRoutes();
  const [searchTerm, setSearchTerm] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, error, refetch } = useCustomerContacts({
    search: debouncedSearch || undefined,
    includeInactive,
    page,
    limit,
  });

  // useApiQuery ya extrae data.data del ApiResponse, entonces data tiene la estructura:
  // { data: CustomerContactResponseDto[], pagination: {...} }
  const contacts = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const columns = useMemo(() => getColumns(route), [route]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Contactos de Clientes"
          description="Gestiona todos los contactos de tus clientes"
        />

        <div className="space-y-4">
          <ContactFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            includeInactive={includeInactive}
            setIncludeInactive={setIncludeInactive}
          />

          <QueryLoading
            isLoading={isLoading}
            error={error}
            isEmpty={contacts.length === 0}
            emptyMessage="No se encontraron contactos"
            onRetry={refetch}
          >
            <DataTable
              data={contacts}
              columns={columns}
              showPagination={false}
              showSearch={false}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} contactos
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
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
                            onClick={() => setPage(pageNum)}
                            isActive={pagination.page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                      <PaginationItem>
                        <span className="px-2">...</span>
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        className={pagination.page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </QueryLoading>
        </div>
      </div>
    </ErrorBoundary>
  );
}


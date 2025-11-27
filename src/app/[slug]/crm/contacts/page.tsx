'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone,
  Building2,
  Star,
  Users,
  Briefcase,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCustomerContacts } from '@/hooks/use-api';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { Table } from '@/components/table';
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

// Define columns for DataTable
function getColumns(): ColumnDef<CustomerContact>[] {
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
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error, refetch } = useCustomerContacts({
    includeInactive,
    page,
    limit,
  });

  const contacts = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const columns = useMemo(() => getColumns(), []);

  // Stats
  const statsData = useMemo(() => {
    const total = pagination.total || contacts.length;
    const active = contacts.filter(c => c.isActive).length;
    const primary = contacts.filter(c => c.isPrimary).length;

    return [
      {
        label: 'Total Contactos',
        value: total,
        description: 'En todos los clientes',
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
      },
      {
        label: 'Activos',
        value: active,
        description: 'Contactos activos',
        icon: <Users className="h-4 w-4 text-green-500" />,
      },
      {
        label: 'Principales',
        value: primary,
        description: 'Contactos principales',
        icon: <Star className="h-4 w-4 text-yellow-500" />,
      },
    ];
  }, [contacts, pagination]);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <SectionHeader
          title="Contactos de Clientes"
          description="Gestiona todos los contactos de tus clientes"
        />

        <Table
          id="customer-contacts"
          data={contacts}
          columns={columns}
          search={{
            enabled: true,
            placeholder: 'Buscar por nombre, email, teléfono, cargo...',
          }}
          filters={[
            {
              key: 'status',
              label: 'Estado',
              type: 'select',
              options: [
                { value: 'active', label: 'Solo activos' },
                { value: 'all', label: 'Todos' },
              ],
            },
          ]}
          onFiltersChange={(filters) => {
            if (filters.status !== undefined) {
              setIncludeInactive(filters.status === 'all');
            }
          }}
          pagination={{
            enabled: true,
            pageSize: limit,
            serverSide: true,
            total: pagination.total,
            onPageChange: (newPage) => setPage(newPage),
          }}
          stats={{
            enabled: true,
            stats: statsData,
          }}
          emptyState={{
            icon: <Users className="h-16 w-16 text-muted-foreground/50" />,
            title: 'No hay contactos',
            description: 'Comienza agregando contactos a tus clientes para gestionar mejor tus relaciones',
          }}
          isLoading={isLoading}
          isError={!!error}
          error={error as Error | null}
          onRetry={refetch}
          features={{
            columnVisibility: true,
          }}
          getRowId={(row) => row.id}
          onRowClick={(contact) => {
            router.push(route(`/crm/customers/${contact.customerId}`));
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { TenantUser, UserRole } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DataTable, DataTableAction } from '@/components/ui/data-table';

interface UsersTableProps {
  data: TenantUser[];
  onView?: (user: TenantUser) => void;
  onEdit?: (user: TenantUser) => void;
  onDelete?: (user: TenantUser) => void;
  isLoading?: boolean;
}

const roleColors: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  [UserRole.MANAGER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  [UserRole.SALES]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  [UserRole.OPERATOR]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  [UserRole.ACCOUNTANT]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  [UserRole.VIEWER]: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const roleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.MANAGER]: 'Gerente',
  [UserRole.SALES]: 'Ventas',
  [UserRole.OPERATOR]: 'Operador',
  [UserRole.ACCOUNTANT]: 'Contador',
  [UserRole.VIEWER]: 'Visualizador',
};

export function UsersTable({
  data,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: UsersTableProps) {
  const columns: ColumnDef<TenantUser>[] = [
    {
      accessorKey: 'name',
      header: 'Usuario',
      cell: ({ row }) => {
        const user = row.original;
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Sin nombre';
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-nidia-green to-nidia-purple rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.firstName?.[0] || user.email[0].toUpperCase()}
                {user.lastName?.[0] || ''}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{fullName}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge
            variant="outline"
            className={roleColors[role] || 'bg-muted text-muted-foreground'}
          >
            {roleLabels[role] || role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'department',
      header: 'Departamento',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.department || (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'position',
      header: 'Cargo',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.position || (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'contact',
      header: 'Contacto',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="space-y-1">
            {user.phone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-3 w-3 mr-1" />
                {user.phone}
              </div>
            )}
            {user.email && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-3 w-3 mr-1" />
                {user.email}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={isActive ? 'bg-green-500/10 text-green-600 dark:text-green-400' : ''}
          >
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Último Acceso',
      cell: ({ row }) => {
        const lastLogin = row.original.lastLoginAt;
        if (!lastLogin) {
          return <span className="text-sm text-muted-foreground">Nunca</span>;
        }
        return (
          <span className="text-sm">
            {format(new Date(lastLogin), 'dd MMM yyyy', { locale: es })}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha de Creación',
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy', { locale: es })}
        </span>
      ),
    },
  ];

  const actions: DataTableAction<TenantUser>[] = [
    ...(onView
      ? [
          {
            label: 'Ver detalle',
            icon: <Eye className="h-4 w-4" />,
            onClick: onView,
          } as DataTableAction<TenantUser>,
        ]
      : []),
    ...(onEdit
      ? [
          {
            label: 'Editar',
            icon: <Edit className="h-4 w-4" />,
            onClick: onEdit,
          } as DataTableAction<TenantUser>,
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: 'Eliminar',
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'destructive' as const,
            separator: true,
            onClick: onDelete,
          } as DataTableAction<TenantUser>,
        ]
      : []),
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Buscar por nombre, email, ID de empleado..."
      emptyMessage="No hay usuarios"
      emptyDescription="Comienza agregando tu primer usuario"
      isLoading={isLoading}
      actions={actions}
      enableColumnVisibility={true}
      enableColumnSizing={true}
      getRowId={(row) => row.id}
    />
  );
}


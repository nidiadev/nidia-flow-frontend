'use client';

import { ColumnDef } from '@tanstack/react-table';
import { SystemUser } from '@/lib/api/system-users';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DataTable, DataTableAction } from '@/components/ui/data-table';

interface SystemUsersTableProps {
  data: SystemUser[];
  onView?: (user: SystemUser) => void;
  onEdit?: (user: SystemUser) => void;
  onDelete?: (user: SystemUser) => void;
  isLoading?: boolean;
}

export function SystemUsersTable({
  data,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: SystemUsersTableProps) {
  const columns: ColumnDef<SystemUser>[] = [
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.email}</span>
          {(row.original.firstName || row.original.lastName) && (
            <span className="text-xs text-muted-foreground">
              {[row.original.firstName, row.original.lastName].filter(Boolean).join(' ')}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'systemRole',
      header: 'Rol',
      cell: ({ row }) => {
        const role = row.original.systemRole;
        const roleColors: Record<string, string> = {
          super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
          support: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        };
        const roleLabels: Record<string, string> = {
          super_admin: 'Super Admin',
          support: 'Soporte',
        };
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
      accessorKey: 'emailVerified',
      header: 'Email Verificado',
      cell: ({ row }) => {
        const verified = row.original.emailVerified;
        return (
          <Badge
            variant="outline"
            className={verified ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}
          >
            {verified ? 'Verificado' : 'No verificado'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Último Acceso',
      cell: ({ row }) => {
        const lastLogin = row.original.lastLoginAt;
        return (
          <span className="text-sm text-muted-foreground">
            {lastLogin
              ? format(new Date(lastLogin), 'PPp', { locale: es })
              : 'Nunca'}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 px-2 lg:px-3"
          >
            Creado
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), 'PP', { locale: es })}
        </span>
      ),
    },
  ];

  const actions: DataTableAction<SystemUser>[] = [];

  if (onView) {
    actions.push({
      label: 'Ver detalles',
      icon: Eye,
      onClick: onView,
    });
  }

  if (onEdit) {
    actions.push({
      label: 'Editar',
      icon: Edit,
      onClick: onEdit,
    });
  }

  if (onDelete) {
    actions.push({
      label: 'Eliminar',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive',
    });
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      actions={actions}
      isLoading={isLoading}
    />
  );
}


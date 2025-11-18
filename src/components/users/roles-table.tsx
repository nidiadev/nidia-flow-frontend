'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Role } from '@/lib/api/roles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Shield, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DataTable, DataTableAction } from '@/components/ui/data-table';

interface RolesTableProps {
  data: Role[];
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  isLoading?: boolean;
}

const permissionLabels: Record<string, string> = {
  'crm:read': 'Leer CRM',
  'crm:write': 'Escribir CRM',
  'crm:delete': 'Eliminar CRM',
  'crm:export': 'Exportar CRM',
  'crm:assign': 'Asignar CRM',
  'orders:read': 'Leer Órdenes',
  'orders:write': 'Escribir Órdenes',
  'orders:delete': 'Eliminar Órdenes',
  'orders:assign': 'Asignar Órdenes',
  'orders:approve': 'Aprobar Órdenes',
  'tasks:read': 'Leer Tareas',
  'tasks:write': 'Escribir Tareas',
  'tasks:delete': 'Eliminar Tareas',
  'tasks:assign': 'Asignar Tareas',
  'tasks:complete': 'Completar Tareas',
  'products:read': 'Leer Productos',
  'products:write': 'Escribir Productos',
  'products:delete': 'Eliminar Productos',
  'products:manage_inventory': 'Gestionar Inventario',
  'accounting:read': 'Leer Contabilidad',
  'accounting:write': 'Escribir Contabilidad',
  'accounting:delete': 'Eliminar Contabilidad',
  'accounting:reports': 'Reportes Contabilidad',
  'reports:read': 'Leer Reportes',
  'reports:create': 'Crear Reportes',
  'reports:schedule': 'Programar Reportes',
  'reports:export': 'Exportar Reportes',
  'users:read': 'Leer Usuarios',
  'users:write': 'Escribir Usuarios',
  'users:delete': 'Eliminar Usuarios',
  'users:invite': 'Invitar Usuarios',
  'users:manage_roles': 'Gestionar Roles',
  'settings:read': 'Leer Configuración',
  'settings:write': 'Escribir Configuración',
  'settings:integrations': 'Gestionar Integraciones',
};

export function RolesTable({
  data,
  onEdit,
  onDelete,
  isLoading = false,
}: RolesTableProps) {
  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: 'name',
      header: 'Rol',
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {role.isSystemRole ? (
                <Shield className="h-5 w-5 text-nidia-purple" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium">{role.name}</span>
                {role.isSystemRole && (
                  <Badge variant="outline" className="text-xs">
                    Sistema
                  </Badge>
                )}
              </div>
              {role.description && (
                <span className="text-xs text-muted-foreground">{role.description}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'permissions',
      header: 'Permisos',
      cell: ({ row }) => {
        const permissions = row.original.permissions || [];
        const displayCount = 3;
        const visible = permissions.slice(0, displayCount);
        const remaining = permissions.length - displayCount;

        return (
          <div className="flex flex-wrap gap-1">
            {visible.map((perm, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {permissionLabels[perm] || perm}
              </Badge>
            ))}
            {remaining > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remaining} más
              </Badge>
            )}
            {permissions.length === 0 && (
              <span className="text-sm text-muted-foreground">Sin permisos</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'permissionsCount',
      header: 'Total Permisos',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.permissions?.length || 0}
        </span>
      ),
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

  const actions: DataTableAction<Role>[] = [
    ...(onEdit
      ? [
          {
            label: 'Editar',
            icon: <Edit className="h-4 w-4" />,
            onClick: onEdit,
            disabled: (role) => role.isSystemRole, // Deshabilitar edición de roles del sistema
          } as DataTableAction<Role>,
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
            disabled: (role) => role.isSystemRole, // Deshabilitar eliminación de roles del sistema
          } as DataTableAction<Role>,
        ]
      : []),
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Buscar por nombre de rol..."
      emptyMessage="No hay roles"
      emptyDescription="Comienza creando tu primer rol personalizado"
      isLoading={isLoading}
      actions={actions}
      enableColumnVisibility={true}
      enableColumnSizing={true}
      getRowId={(row) => row.id}
    />
  );
}


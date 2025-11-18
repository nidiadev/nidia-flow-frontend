'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { CreateRoleDto, UpdateRoleDto, Role, PermissionsByModule } from '@/lib/api/roles';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const roleFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
  description: z.string().max(500).optional().or(z.literal('')),
  permissions: z.array(z.string()).min(1, 'Debes seleccionar al menos un permiso'),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

export interface RoleFormRef {
  submit: () => void;
}

interface RoleFormProps {
  defaultValues?: Partial<Role>;
  permissionsByModule: PermissionsByModule;
  onSubmit: (data: CreateRoleDto | UpdateRoleDto) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showActions?: boolean;
  isEdit?: boolean;
}

const moduleLabels: Record<keyof PermissionsByModule, string> = {
  crm: 'CRM',
  orders: 'Órdenes',
  tasks: 'Tareas',
  products: 'Productos',
  accounting: 'Contabilidad',
  reports: 'Reportes',
  users: 'Usuarios',
  settings: 'Configuración',
};

const permissionLabels: Record<string, string> = {
  'crm:read': 'Leer',
  'crm:write': 'Escribir',
  'crm:delete': 'Eliminar',
  'crm:export': 'Exportar',
  'crm:assign': 'Asignar',
  'orders:read': 'Leer',
  'orders:write': 'Escribir',
  'orders:delete': 'Eliminar',
  'orders:assign': 'Asignar',
  'orders:approve': 'Aprobar',
  'tasks:read': 'Leer',
  'tasks:write': 'Escribir',
  'tasks:delete': 'Eliminar',
  'tasks:assign': 'Asignar',
  'tasks:complete': 'Completar',
  'products:read': 'Leer',
  'products:write': 'Escribir',
  'products:delete': 'Eliminar',
  'products:manage_inventory': 'Gestionar Inventario',
  'accounting:read': 'Leer',
  'accounting:write': 'Escribir',
  'accounting:delete': 'Eliminar',
  'accounting:reports': 'Reportes',
  'reports:read': 'Leer',
  'reports:create': 'Crear',
  'reports:schedule': 'Programar',
  'reports:export': 'Exportar',
  'users:read': 'Leer',
  'users:write': 'Escribir',
  'users:delete': 'Eliminar',
  'users:invite': 'Invitar',
  'users:manage_roles': 'Gestionar Roles',
  'settings:read': 'Leer',
  'settings:write': 'Escribir',
  'settings:integrations': 'Gestionar Integraciones',
};

export const RoleForm = forwardRef<RoleFormRef, RoleFormProps>(
  ({ defaultValues, permissionsByModule, onSubmit, onCancel, isLoading = false, showActions = true, isEdit = false }, ref) => {
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
      defaultValues?.permissions || []
    );

    const form = useForm<RoleFormValues>({
      resolver: zodResolver(roleFormSchema) as any,
      defaultValues: {
        name: defaultValues?.name || '',
        description: defaultValues?.description || '',
        permissions: defaultValues?.permissions || [],
      },
    });

    // Actualizar valores cuando cambien los defaultValues
    useEffect(() => {
      if (defaultValues) {
        const perms = defaultValues.permissions || [];
        setSelectedPermissions(perms);
        form.reset({
          name: defaultValues.name || '',
          description: defaultValues.description || '',
          permissions: perms,
        });
      }
    }, [defaultValues, form]);

    // Sincronizar selectedPermissions con el form
    useEffect(() => {
      form.setValue('permissions', selectedPermissions);
    }, [selectedPermissions, form]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.handleSubmit(handleSubmit)();
      },
    }));

    const handleSubmit = async (values: RoleFormValues) => {
      const submitData: CreateRoleDto | UpdateRoleDto = {
        name: values.name,
        ...(values.description && { description: values.description }),
        permissions: values.permissions,
      };

      await onSubmit(submitData);
    };

    const togglePermission = (permission: string) => {
      setSelectedPermissions((prev) =>
        prev.includes(permission)
          ? prev.filter((p) => p !== permission)
          : [...prev, permission]
      );
    };

    const toggleModulePermissions = (module: keyof PermissionsByModule, selectAll: boolean) => {
      const modulePermissions = permissionsByModule[module] || [];
      if (selectAll) {
        // Agregar todos los permisos del módulo que no estén ya seleccionados
        setSelectedPermissions((prev) => {
          const newPerms = [...prev];
          modulePermissions.forEach((perm) => {
            if (!newPerms.includes(perm)) {
              newPerms.push(perm);
            }
          });
          return newPerms;
        });
      } else {
        // Remover todos los permisos del módulo
        setSelectedPermissions((prev) =>
          prev.filter((perm) => !modulePermissions.includes(perm))
        );
      }
    };

    const isModuleFullySelected = (module: keyof PermissionsByModule): boolean => {
      const modulePermissions = permissionsByModule[module] || [];
      return modulePermissions.length > 0 && modulePermissions.every((perm) => selectedPermissions.includes(perm));
    };

    const isModulePartiallySelected = (module: keyof PermissionsByModule): boolean => {
      const modulePermissions = permissionsByModule[module] || [];
      const selectedCount = modulePermissions.filter((perm) => selectedPermissions.includes(perm)).length;
      return selectedCount > 0 && selectedCount < modulePermissions.length;
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Información Básica</div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Rol *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Gerente de Proyectos" {...field} />
                  </FormControl>
                  <FormDescription>
                    El nombre debe ser único y descriptivo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el propósito y alcance de este rol..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Permisos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Permisos</div>
              <Badge variant="outline">
                {selectedPermissions.length} permiso{selectedPermissions.length !== 1 ? 's' : ''} seleccionado{selectedPermissions.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <FormControl>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-4">
                        {(Object.keys(permissionsByModule) as Array<keyof PermissionsByModule>).map((module) => {
                          const modulePermissions = permissionsByModule[module] || [];
                          const isFullySelected = isModuleFullySelected(module);
                          const isPartiallySelected = isModulePartiallySelected(module);

                          return (
                            <Card key={module}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">
                                    {moduleLabels[module]}
                                  </CardTitle>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleModulePermissions(module, !isFullySelected)}
                                  >
                                    {isFullySelected ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                                  </Button>
                                </div>
                                <CardDescription>
                                  {modulePermissions.length} permiso{modulePermissions.length !== 1 ? 's' : ''} disponible{modulePermissions.length !== 1 ? 's' : ''}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {modulePermissions.map((permission) => {
                                    const isSelected = selectedPermissions.includes(permission);
                                    const label = permissionLabels[permission] || permission;

                                    return (
                                      <div
                                        key={permission}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={permission}
                                          checked={isSelected}
                                          onCheckedChange={() => togglePermission(permission)}
                                        />
                                        <label
                                          htmlFor={permission}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                        >
                                          {label}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </FormControl>
                  <FormDescription>
                    Selecciona los permisos que tendrá este rol. Los permisos determinan qué acciones puede realizar un usuario con este rol.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {showActions && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Actualizar Rol' : 'Crear Rol'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

RoleForm.displayName = 'RoleForm';


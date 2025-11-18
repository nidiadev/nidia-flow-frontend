'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { CreateSubModuleData, UpdateSubModuleData } from '@/lib/api/submodules';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const subModuleFormSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  displayName: z
    .string()
    .min(2, 'El nombre de visualización debe tener al menos 2 caracteres')
    .max(255, 'El nombre de visualización no puede exceder 255 caracteres'),
  description: z.string().optional(),
  icon: z.string().optional(),
  path: z
    .string()
    .regex(/^\/[a-z0-9/-]*$/, 'La ruta debe empezar con / y contener solo letras minúsculas, números, guiones y barras')
    .optional()
    .or(z.literal('')),
  sortOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  permissions: z.array(z.string()).default([]),
});

export interface SubModuleFormRef {
  submit: () => void;
  reset: () => void;
}

interface SubModuleFormProps {
  defaultValues?: Partial<CreateSubModuleData>;
  onSubmit: (data: CreateSubModuleData | UpdateSubModuleData) => void | Promise<void>;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  moduleId: string;
}

export const SubModuleForm = forwardRef<SubModuleFormRef, SubModuleFormProps>(
  ({ defaultValues, onSubmit, isLoading = false, mode = 'create', moduleId }, ref) => {
    const [permissionInput, setPermissionInput] = useState('');

    const form = useForm<z.infer<typeof subModuleFormSchema>>({
      resolver: zodResolver(subModuleFormSchema) as any,
      defaultValues: {
        name: defaultValues?.name || '',
        displayName: defaultValues?.displayName || '',
        description: defaultValues?.description || '',
        icon: defaultValues?.icon || '',
        path: defaultValues?.path || '',
        sortOrder: defaultValues?.sortOrder ?? 0,
        isActive: defaultValues?.isActive ?? true,
        isVisible: defaultValues?.isVisible ?? true,
        permissions: defaultValues?.permissions || [],
      },
    });

    const permissions = form.watch('permissions') || [];

    const handleSubmit = async (values: z.infer<typeof subModuleFormSchema>) => {
      const submitData: CreateSubModuleData | UpdateSubModuleData = {
        ...values,
        path: values.path || undefined,
        permissions: values.permissions.length > 0 ? values.permissions : undefined,
      };
      await onSubmit(submitData);
    };

    useImperativeHandle(ref, () => ({
      submit: () => form.handleSubmit(handleSubmit)(),
      reset: () => form.reset(),
    }));

    const addPermission = () => {
      if (permissionInput.trim() && !permissions.includes(permissionInput.trim())) {
        form.setValue('permissions', [...permissions, permissionInput.trim()]);
        setPermissionInput('');
      }
    };

    const removePermission = (perm: string) => {
      form.setValue(
        'permissions',
        permissions.filter((p) => p !== perm)
      );
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Submódulo *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="customers"
                    {...field}
                    disabled={mode === 'edit' || isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Identificador único (solo letras minúsculas, números y guiones)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre para Mostrar *</FormLabel>
                <FormControl>
                  <Input placeholder="Gestión de Clientes" {...field} disabled={isLoading} />
                </FormControl>
                <FormDescription>Nombre que se mostrará en la interfaz</FormDescription>
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
                    placeholder="CRUD completo de clientes, leads y prospects"
                    {...field}
                    disabled={isLoading}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>Descripción del submódulo</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono</FormLabel>
                  <FormControl>
                    <Input placeholder="Users" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>Nombre del icono de lucide-react</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ruta</FormLabel>
                  <FormControl>
                    <Input placeholder="/crm/customers" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>Ruta del frontend (opcional)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orden de Visualización</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>Orden en el que aparecerá el submódulo</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="permissions"
            render={() => (
              <FormItem>
                <FormLabel>Permisos</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="read, write, delete"
                        value={permissionInput}
                        onChange={(e) => setPermissionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addPermission();
                          }
                        }}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addPermission}
                        disabled={isLoading || !permissionInput.trim()}
                      >
                        Agregar
                      </Button>
                    </div>
                    {permissions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {permissions.map((perm) => (
                          <Badge key={perm} variant="secondary" className="gap-1">
                            {perm}
                            <button
                              type="button"
                              onClick={() => removePermission(perm)}
                              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              disabled={isLoading}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Permisos requeridos para acceder a este submódulo
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Activo</FormLabel>
                    <FormDescription>
                      Si está inactivo, el submódulo no estará disponible
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isVisible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Visible</FormLabel>
                    <FormDescription>
                      Si está oculto, no se mostrará en la interfaz
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    );
  }
);

SubModuleForm.displayName = 'SubModuleForm';


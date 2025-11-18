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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { CreateModuleData, UpdateModuleData } from '@/lib/api/modules';

const moduleFormSchema = z.object({
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
    .min(1, 'La ruta es requerida')
    .regex(/^\/[a-z0-9/-]*$/, 'La ruta debe empezar con / y contener solo letras minúsculas, números, guiones y barras'),
  category: z.string().optional(),
  sortOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
});

type ModuleFormValues = z.infer<typeof moduleFormSchema>;

export interface ModuleFormRef {
  submit: () => void;
  reset: () => void;
}

interface ModuleFormProps {
  defaultValues?: Partial<ModuleFormValues>;
  onSubmit: (data: CreateModuleData | UpdateModuleData) => Promise<void>;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export const ModuleForm = forwardRef<ModuleFormRef, ModuleFormProps>(
  ({ defaultValues, onSubmit, isLoading = false, mode = 'create' }, ref) => {
    const form = useForm<ModuleFormValues>({
      resolver: zodResolver(moduleFormSchema) as any,
      defaultValues: {
        name: defaultValues?.name || '',
        displayName: defaultValues?.displayName || '',
        description: defaultValues?.description || '',
        icon: defaultValues?.icon || '',
        path: defaultValues?.path || '',
        category: defaultValues?.category || '',
        sortOrder: defaultValues?.sortOrder ?? 0,
        isActive: defaultValues?.isActive ?? true,
        isVisible: defaultValues?.isVisible ?? true,
      },
    });

    useImperativeHandle(ref, () => ({
      submit: () => form.handleSubmit(handleSubmit)(),
      reset: () => form.reset(),
    }));

    const handleSubmit = async (data: ModuleFormValues) => {
      await onSubmit(data);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Módulo *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="crm"
                    {...field}
                    disabled={mode === 'edit'}
                  />
                </FormControl>
                <FormDescription>
                  Identificador único del módulo (solo letras minúsculas, números y guiones)
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
                <FormLabel>Nombre de Visualización *</FormLabel>
                <FormControl>
                  <Input placeholder="CRM" {...field} />
                </FormControl>
                <FormDescription>
                  Nombre que se mostrará en la interfaz
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
                    placeholder="Gestión de relaciones con clientes"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Users"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Nombre del icono de lucide-react
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ruta *</FormLabel>
                  <FormControl>
                    <Input placeholder="/crm" {...field} />
                  </FormControl>
                  <FormDescription>
                    Ruta en el frontend
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="business">Negocio</SelectItem>
                      <SelectItem value="operations">Operaciones</SelectItem>
                      <SelectItem value="finance">Finanzas</SelectItem>
                      <SelectItem value="analytics">Analítica</SelectItem>
                      <SelectItem value="integrations">Integraciones</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Orden de visualización (menor = primero)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center gap-6">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Activo</FormLabel>
                    <FormDescription>
                      Si está inactivo, el módulo no estará disponible
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
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
                      Mostrar en sidebar aunque no esté habilitado
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Los botones de acción se manejan desde el Sheet en la página */}
        </form>
      </Form>
    );
  }
);

ModuleForm.displayName = 'ModuleForm';


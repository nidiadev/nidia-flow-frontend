'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { CreateSystemUserDto, UpdateSystemUserDto, SystemUser } from '@/lib/api/system-users';
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

const systemUserFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    )
    .optional()
    .or(z.literal('')),
  firstName: z.string().max(100).optional().or(z.literal('')),
  lastName: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  systemRole: z.enum(['super_admin', 'support']),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
});

type SystemUserFormValues = z.infer<typeof systemUserFormSchema>;

export interface SystemUserFormRef {
  submit: () => void;
}

interface SystemUserFormProps {
  defaultValues?: Partial<SystemUser>;
  onSubmit: (data: CreateSystemUserDto | UpdateSystemUserDto) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showActions?: boolean;
  isEdit?: boolean;
}

export const SystemUserForm = forwardRef<SystemUserFormRef, SystemUserFormProps>(
  ({ defaultValues, onSubmit, onCancel, isLoading = false, showActions = true, isEdit = false }, ref) => {
    const form = useForm<SystemUserFormValues>({
      resolver: zodResolver(systemUserFormSchema) as any,
      defaultValues: {
        email: defaultValues?.email || '',
        password: '',
        firstName: defaultValues?.firstName || '',
        lastName: defaultValues?.lastName || '',
        phone: defaultValues?.phone || '',
        systemRole: defaultValues?.systemRole || 'support',
        isActive: defaultValues?.isActive ?? true,
        emailVerified: defaultValues?.emailVerified ?? false,
      },
    });

    // Actualizar valores cuando cambien los defaultValues
    useEffect(() => {
      if (defaultValues) {
        form.reset({
          email: defaultValues.email || '',
          password: '', // No pre-llenar contraseña
          firstName: defaultValues.firstName || '',
          lastName: defaultValues.lastName || '',
          phone: defaultValues.phone || '',
          systemRole: defaultValues.systemRole || 'support',
          isActive: defaultValues.isActive ?? true,
          emailVerified: defaultValues.emailVerified ?? false,
        });
      }
    }, [defaultValues, form]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.handleSubmit(handleSubmit)();
      },
    }));

    const handleSubmit = async (values: SystemUserFormValues) => {
      const submitData: CreateSystemUserDto | UpdateSystemUserDto = {
        email: values.email,
        ...(values.password && { password: values.password }),
        ...(values.firstName && { firstName: values.firstName }),
        ...(values.lastName && { lastName: values.lastName }),
        ...(values.phone && { phone: values.phone }),
        systemRole: values.systemRole,
        isActive: values.isActive,
        emailVerified: values.emailVerified,
      };

      await onSubmit(submitData);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Información Básica</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@nidia.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+57 300 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEdit ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormDescription>
                    {isEdit
                      ? 'Dejar vacío para mantener la contraseña actual'
                      : 'Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Configuración */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Configuración</div>

            <FormField
              control={form.control}
              name="systemRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol del Sistema *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Administrador</SelectItem>
                      <SelectItem value="support">Soporte</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    El rol determina los permisos y acceso del usuario en el sistema
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
                      <FormLabel className="text-base">Usuario Activo</FormLabel>
                      <FormDescription>
                        Los usuarios inactivos no pueden iniciar sesión
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
                name="emailVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Email Verificado</FormLabel>
                      <FormDescription>
                        Indica si el email del usuario ha sido verificado
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
          </div>

          {showActions && (
            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Actualizar Usuario' : 'Crear Usuario'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

SystemUserForm.displayName = 'SystemUserForm';


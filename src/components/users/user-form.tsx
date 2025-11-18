'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { CreateUserDto, UpdateUserDto, TenantUser, UserRole } from '@/lib/api/users';
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

const createUserFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().max(100).optional().or(z.literal('')),
  lastName: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  role: z.nativeEnum(UserRole),
  department: z.string().max(100).optional().or(z.literal('')),
  position: z.string().max(100).optional().or(z.literal('')),
  employeeId: z.string().max(50).optional().or(z.literal('')),
  hireDate: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

const updateUserFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .optional()
    .or(z.literal('')),
  firstName: z.string().max(100).optional().or(z.literal('')),
  lastName: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  role: z.nativeEnum(UserRole),
  department: z.string().max(100).optional().or(z.literal('')),
  position: z.string().max(100).optional().or(z.literal('')),
  employeeId: z.string().max(50).optional().or(z.literal('')),
  hireDate: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof createUserFormSchema> | z.infer<typeof updateUserFormSchema>;

export interface UserFormRef {
  submit: () => void;
}

interface UserFormProps {
  defaultValues?: Partial<TenantUser>;
  onSubmit: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showActions?: boolean;
  isEdit?: boolean;
}

export const UserForm = forwardRef<UserFormRef, UserFormProps>(
  ({ defaultValues, onSubmit, onCancel, isLoading = false, showActions = true, isEdit = false }, ref) => {
    const form = useForm<UserFormValues>({
      resolver: zodResolver(isEdit ? updateUserFormSchema : createUserFormSchema) as any,
      defaultValues: {
        email: defaultValues?.email || '',
        password: '',
        firstName: defaultValues?.firstName || '',
        lastName: defaultValues?.lastName || '',
        phone: defaultValues?.phone || '',
        role: defaultValues?.role || UserRole.VIEWER,
        department: defaultValues?.department || '',
        position: defaultValues?.position || '',
        employeeId: defaultValues?.employeeId || '',
        hireDate: defaultValues?.hireDate ? new Date(defaultValues.hireDate).toISOString().split('T')[0] : '',
        isActive: defaultValues?.isActive ?? true,
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
          role: defaultValues.role || UserRole.VIEWER,
          department: defaultValues.department || '',
          position: defaultValues.position || '',
          employeeId: defaultValues.employeeId || '',
          hireDate: defaultValues.hireDate ? new Date(defaultValues.hireDate).toISOString().split('T')[0] : '',
          isActive: defaultValues.isActive ?? true,
        });
      }
    }, [defaultValues, form]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.handleSubmit(handleSubmit)();
      },
    }));

    const handleSubmit = async (values: UserFormValues) => {
      const submitData: CreateUserDto | UpdateUserDto = {
        email: values.email,
        ...(values.password && { password: values.password }),
        ...(values.firstName && { firstName: values.firstName }),
        ...(values.lastName && { lastName: values.lastName }),
        ...(values.phone && { phone: values.phone }),
        role: values.role,
        ...(values.department && { department: values.department }),
        ...(values.position && { position: values.position }),
        ...(values.employeeId && { employeeId: values.employeeId }),
        ...(values.hireDate && { hireDate: values.hireDate }),
        isActive: values.isActive,
      };

      await onSubmit(submitData);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Información Personal</div>

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
                    <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
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
                    <Input placeholder="+57 300 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                    </FormControl>
                    <FormDescription>
                      La contraseña debe tener al menos 8 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isEdit && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Deja la contraseña en blanco para mantener la actual. Si deseas cambiarla, ingresa una nueva.
                </p>
              </div>
            )}
          </div>

          {/* Información Laboral */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Información Laboral</div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                      <SelectItem value={UserRole.MANAGER}>Gerente</SelectItem>
                      <SelectItem value={UserRole.SALES}>Ventas</SelectItem>
                      <SelectItem value={UserRole.OPERATOR}>Operador</SelectItem>
                      <SelectItem value={UserRole.ACCOUNTANT}>Contador</SelectItem>
                      <SelectItem value={UserRole.VIEWER}>Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    El rol determina los permisos y acceso del usuario
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ventas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input placeholder="Representante de Ventas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID de Empleado</FormLabel>
                    <FormControl>
                      <Input placeholder="EMP001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Contratación</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Estado</div>

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
                {isEdit ? 'Actualizar Usuario' : 'Crear Usuario'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

UserForm.displayName = 'UserForm';


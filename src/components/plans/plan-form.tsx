'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { forwardRef, useImperativeHandle } from 'react';
import { Plan } from '@/lib/api/plans';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

const planFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  displayName: z.string().min(2, 'El nombre para mostrar debe tener al menos 2 caracteres').max(255),
  description: z.string().max(1000).optional(),
  priceMonthly: z.number().min(0, 'El precio debe ser mayor o igual a 0').optional(),
  priceYearly: z.number().min(0, 'El precio debe ser mayor o igual a 0').optional(),
  currency: z.string().length(3, 'La moneda debe tener 3 caracteres').default('USD'),
  maxUsers: z.number().min(0, 'El límite debe ser mayor o igual a 0').optional(),
  maxStorageGb: z.number().min(0, 'El límite debe ser mayor o igual a 0').optional(),
  maxMonthlyEmails: z.number().min(0, 'El límite debe ser mayor o igual a 0').optional(),
  maxMonthlyWhatsapp: z.number().min(0, 'El límite debe ser mayor o igual a 0').optional(),
  maxMonthlyApiCalls: z.number().min(0, 'El límite debe ser mayor o igual a 0').optional(),
  enabledModules: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().min(0).default(0),
  stripePriceIdMonthly: z.string().optional(),
  stripePriceIdYearly: z.string().optional(),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

export interface PlanFormRef {
  submit: () => void;
}

interface PlanFormProps {
  defaultValues?: Partial<Plan>;
  onSubmit: (data: Partial<Plan>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showActions?: boolean;
}

// Módulos disponibles
const AVAILABLE_MODULES = [
  'CRM',
  'Orders',
  'Tasks',
  'Accounting',
  'Reports',
  'Communications',
  'Products',
  'Files',
  'Settings',
  'Audit',
];

export const PlanForm = forwardRef<PlanFormRef, PlanFormProps>(
  ({ defaultValues, onSubmit, onCancel, isLoading = false, showActions = true }, ref) => {
    const form = useForm<PlanFormValues>({
      resolver: zodResolver(planFormSchema) as any,
      defaultValues: {
        name: defaultValues?.name || '',
        displayName: defaultValues?.displayName || '',
        description: defaultValues?.description || '',
        priceMonthly: defaultValues?.priceMonthly ? Number(defaultValues.priceMonthly) : undefined,
        priceYearly: defaultValues?.priceYearly ? Number(defaultValues.priceYearly) : undefined,
        currency: defaultValues?.currency || 'USD',
        maxUsers: defaultValues?.maxUsers || undefined,
        maxStorageGb: defaultValues?.maxStorageGb || undefined,
        maxMonthlyEmails: defaultValues?.maxMonthlyEmails || undefined,
        maxMonthlyWhatsapp: defaultValues?.maxMonthlyWhatsapp || undefined,
        maxMonthlyApiCalls: defaultValues?.maxMonthlyApiCalls || undefined,
        enabledModules: defaultValues?.enabledModules || [],
        isActive: defaultValues?.isActive ?? true,
        isVisible: defaultValues?.isVisible ?? true,
        sortOrder: defaultValues?.sortOrder || 0,
        stripePriceIdMonthly: defaultValues?.stripePriceIdMonthly || '',
        stripePriceIdYearly: defaultValues?.stripePriceIdYearly || '',
      },
    });

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.handleSubmit(handleSubmit)();
      },
    }));

    const handleSubmit = async (data: PlanFormValues) => {
      await onSubmit(data);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Información Básica</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Plan (ID)</FormLabel>
                    <FormControl>
                      <Input placeholder="basic-plan" {...field} />
                    </FormControl>
                    <FormDescription>
                      Identificador único del plan (solo letras minúsculas, números y guiones)
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
                    <FormLabel>Nombre para Mostrar</FormLabel>
                    <FormControl>
                      <Input placeholder="Plan Básico" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nombre visible para los clientes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción del plan..."
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

          {/* Precios */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Precios</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="priceMonthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Mensual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceYearly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Anual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                        <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                        <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                        <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                        <SelectItem value="BRL">BRL - Real Brasileño</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Límites */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Límites del Plan</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="maxUsers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de Usuarios</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Sin límite"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxStorageGb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Almacenamiento (GB)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Sin límite"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxMonthlyEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emails Mensuales</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Sin límite"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxMonthlyWhatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Mensuales</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Sin límite"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxMonthlyApiCalls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Llamadas API Mensuales</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Sin límite"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Módulos Habilitados */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Módulos Habilitados</p>
            <FormField
              control={form.control}
              name="enabledModules"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {AVAILABLE_MODULES.map((module) => (
                      <FormField
                        key={module}
                        control={form.control}
                        name="enabledModules"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={module}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(module)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), module])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== module)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {module}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Configuración */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Configuración</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden de Visualización</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      Determina el orden en que se muestran los planes (menor = primero)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Plan Activo</FormLabel>
                        <FormDescription>
                          Los planes inactivos no pueden ser asignados a nuevos clientes
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isVisible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Visible en Página de Precios</FormLabel>
                        <FormDescription>
                          Si está oculto, no se mostrará en la página pública de precios
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Stripe IDs (Opcional) */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Integración con Stripe (Opcional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stripePriceIdMonthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Price ID (Mensual)</FormLabel>
                    <FormControl>
                      <Input placeholder="price_xxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stripePriceIdYearly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Price ID (Anual)</FormLabel>
                    <FormControl>
                      <Input placeholder="price_xxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {showActions && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {defaultValues ? 'Actualizar Plan' : 'Crear Plan'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

PlanForm.displayName = 'PlanForm';


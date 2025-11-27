'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, TrendingUp } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { leadScoringApi } from '@/lib/api/crm';

const createRuleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres'),
  description: z.string().optional(),
  category: z.enum(['demographic', 'engagement', 'behavior', 'fit', 'negative']),
  points: z.number().min(-100, 'Mínimo -100').max(100, 'Máximo 100'),
  isActive: z.boolean().default(true),
  priority: z.number().min(0).default(0),
  condition: z.object({
    field: z.string().min(1, 'Campo requerido'),
    operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']),
    value: z.any(),
  }),
});

type CreateRuleForm = z.infer<typeof createRuleSchema>;

const FIELD_OPTIONS = [
  { value: 'leadScore', label: 'Lead Score' },
  { value: 'type', label: 'Tipo de Cliente' },
  { value: 'industry', label: 'Industria' },
  { value: 'segment', label: 'Segmento' },
  { value: 'leadSource', label: 'Fuente de Lead' },
  { value: 'totalOrders', label: 'Total de Órdenes' },
  { value: 'totalRevenue', label: 'Ingresos Totales' },
];

export default function NewLeadScoringRulePage() {
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();

  const createRule = useMutation({
    mutationFn: (data: any) => leadScoringApi.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
      toast.success('Regla creada exitosamente');
      router.push(route('/crm/lead-scoring'));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear la regla');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateRuleForm>({
    resolver: zodResolver(createRuleSchema),
    defaultValues: {
      isActive: true,
      priority: 0,
      category: 'demographic',
      condition: {
        field: '',
        operator: 'equals',
        value: '',
      },
    },
  });

  const onSubmit = async (data: CreateRuleForm) => {
    try {
      const ruleData = {
        name: data.name,
        description: data.description,
        category: data.category,
        points: data.points,
        isActive: data.isActive,
        priority: data.priority,
        conditions: [data.condition],
      };
      
      await createRule.mutateAsync(ruleData);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Nueva Regla de Lead Scoring"
          description="Crea una regla para puntuar automáticamente tus leads"
          actions={
            <Button variant="outline" asChild>
              <TenantLink href={route('/crm/lead-scoring')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </TenantLink>
            </Button>
          }
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Información Básica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Nombre *
                    </Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Ej: CEO Bonus Points"
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Describe la regla..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium">
                        Categoría *
                      </Label>
                      <Select
                        value={watch('category')}
                        onValueChange={(value: any) => setValue('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="demographic">Demográfica</SelectItem>
                          <SelectItem value="engagement">Compromiso</SelectItem>
                          <SelectItem value="behavior">Comportamiento</SelectItem>
                          <SelectItem value="fit">Ajuste</SelectItem>
                          <SelectItem value="negative">Negativa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="points" className="text-sm font-medium">
                        Puntos *
                      </Label>
                      <Input
                        id="points"
                        type="number"
                        min="-100"
                        max="100"
                        {...register('points', { valueAsNumber: true })}
                        placeholder="Ej: 20"
                        className={errors.points ? 'border-destructive' : ''}
                      />
                      {errors.points && (
                        <p className="text-xs text-destructive mt-1">{errors.points.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-sm font-medium">
                      Prioridad
                    </Label>
                    <Input
                      id="priority"
                      type="number"
                      min="0"
                      {...register('priority', { valueAsNumber: true })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Mayor prioridad = se evalúa primero
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register('isActive')}
                      className="h-4 w-4 rounded border-gray-300"
                      defaultChecked
                    />
                    <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                      Regla activa
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Condición</CardTitle>
                  <CardDescription>
                    Define cuándo se aplica esta regla
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition.field" className="text-sm font-medium">
                        Campo *
                      </Label>
                      <Select
                        value={watch('condition.field')}
                        onValueChange={(value) => setValue('condition.field', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un campo" />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="condition.operator" className="text-sm font-medium">
                        Operador *
                      </Label>
                      <Select
                        value={watch('condition.operator')}
                        onValueChange={(value: any) => setValue('condition.operator', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Igual a</SelectItem>
                          <SelectItem value="contains">Contiene</SelectItem>
                          <SelectItem value="greater_than">Mayor que</SelectItem>
                          <SelectItem value="less_than">Menor que</SelectItem>
                          <SelectItem value="in">En lista</SelectItem>
                          <SelectItem value="not_in">No en lista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condition.value" className="text-sm font-medium">
                      Valor *
                    </Label>
                    <Input
                      id="condition.value"
                      {...register('condition.value')}
                      placeholder="Valor a comparar"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting || createRule.isPending}
                      size="lg"
                    >
                      {isSubmitting || createRule.isPending ? (
                        <>
                          <Save className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Crear Regla
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}


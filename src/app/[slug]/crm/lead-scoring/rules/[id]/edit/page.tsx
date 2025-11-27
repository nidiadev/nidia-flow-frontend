'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QueryLoading } from '@/components/ui/loading';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { leadScoringApi, LeadScoringRule } from '@/lib/api/crm';

const updateRuleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres'),
  description: z.string().optional(),
  category: z.enum(['demographic', 'engagement', 'behavior', 'fit', 'negative']),
  points: z.number().min(-100, 'Mínimo -100').max(100, 'Máximo 100'),
  isActive: z.boolean(),
  priority: z.number().min(0),
});

type UpdateRuleForm = z.infer<typeof updateRuleSchema>;

export default function EditLeadScoringRulePage() {
  const params = useParams();
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();
  const ruleId = params.id as string;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['lead-scoring-rules', ruleId],
    queryFn: async () => {
      const response = await leadScoringApi.getRule(ruleId);
      return response.data;
    },
  });

  const updateRule = useMutation({
    mutationFn: (data: any) => leadScoringApi.updateRule(ruleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
      toast.success('Regla actualizada exitosamente');
      router.push(route('/crm/lead-scoring'));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar la regla');
    },
  });

  const rule = data as LeadScoringRule | undefined;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<UpdateRuleForm>({
    resolver: zodResolver(updateRuleSchema),
  });

  // Reset form when rule data is loaded
  useEffect(() => {
    if (rule) {
      reset({
        name: rule.name,
        description: rule.description,
        category: rule.category,
        points: rule.points,
        isActive: rule.isActive,
        priority: rule.priority || 0,
      });
    }
  }, [rule, reset]);

  const onSubmit = async (data: UpdateRuleForm) => {
    try {
      await updateRule.mutateAsync(data);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  if (isLoading) {
    return (
      <ErrorBoundary>
        <QueryLoading isLoading={true} isError={false} error={null} isEmpty={false} />
      </ErrorBoundary>
    );
  }

  if (isError || !rule) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <SectionHeader
            title="Regla no encontrada"
            description="La regla que buscas no existe o fue eliminada"
            actions={
              <Button variant="outline" asChild>
                <TenantLink href={route('/crm/lead-scoring')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </TenantLink>
              </Button>
            }
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title={`Editar Regla: ${rule.name}`}
          description="Modifica la regla de lead scoring"
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
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register('isActive')}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                      Regla activa
                    </Label>
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
                      disabled={isSubmitting || updateRule.isPending}
                      size="lg"
                    >
                      {isSubmitting || updateRule.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Cambios
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


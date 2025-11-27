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
import { ArrowLeft, Save, FileEdit } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { SectionHeader } from '@/components/ui/section-header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { toast } from 'sonner';
import { webFormsApi } from '@/lib/api/crm';

const createWebFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CreateWebFormForm = z.infer<typeof createWebFormSchema>;

export default function NewWebFormPage() {
  const router = useRouter();
  const { route } = useTenantRoutes();
  const queryClient = useQueryClient();

  const createWebForm = useMutation({
    mutationFn: (data: any) => webFormsApi.create(data),
    onSuccess: (response) => {
      const form = response.data;
      queryClient.invalidateQueries({ queryKey: ['web-forms'] });
      toast.success('Formulario creado exitosamente');
      router.push(route(`/crm/web-forms/${form.id}`));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear el formulario');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CreateWebFormForm>({
    resolver: zodResolver(createWebFormSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const onSubmit = async (data: CreateWebFormForm) => {
    try {
      const formData = {
        ...data,
        formConfig: {
          fields: [],
          submitButtonText: 'Enviar',
          successMessage: '¡Gracias por tu interés! Nos pondremos en contacto contigo pronto.',
        },
      };
      
      await createWebForm.mutateAsync(formData);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title="Nuevo Formulario Web"
          description="Crea un formulario embebible para capturar leads"
          actions={
            <Button variant="outline" asChild>
              <TenantLink href={route('/crm/web-forms')}>
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
                      placeholder="Ej: Formulario de Contacto"
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
                      placeholder="Describe el propósito del formulario..."
                      rows={3}
                      className="resize-none"
                    />
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
                      Formulario activo
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Campos del Formulario</CardTitle>
                  <CardDescription>
                    Configura los campos después de crear el formulario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileEdit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">
                      Podrás configurar los campos después de crear el formulario
                    </p>
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
                      disabled={isSubmitting || createWebForm.isPending}
                      size="lg"
                    >
                      {isSubmitting || createWebForm.isPending ? (
                        <>
                          <Save className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Crear Formulario
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


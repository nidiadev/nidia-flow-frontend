'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QueryLoading } from '@/components/ui/loading';
import { webFormsApi, WebForm } from '@/lib/api/crm';
import { toast } from 'sonner';
import { useState } from 'react';

export default function WebFormEmbedPage() {
  const params = useParams();
  const formId = params.id as string;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['web-forms', formId, 'embed'],
    queryFn: async () => {
      const response = await webFormsApi.getById(formId);
      return response.data;
    },
  });

  const form = data as WebForm | undefined;
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await webFormsApi.submit(formId, formData);
      toast.success('Formulario enviado exitosamente');
      setFormData({});
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al enviar el formulario');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center">
          <QueryLoading isLoading={true} isError={false} error={null} isEmpty={false} />
        </div>
      </ErrorBoundary>
    );
  }

  if (isError || !form || !form.isActive) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground">
                  {!form ? 'Formulario no encontrado' : 'Este formulario no está disponible'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  // Simple form renderer - can be enhanced later
  const formConfig = form.formConfig || { fields: [] };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{form.name}</CardTitle>
              {form.description && (
                <CardDescription>{form.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {formConfig.fields && formConfig.fields.length > 0 ? (
                  formConfig.fields.map((field: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={field.name || `field-${index}`}>
                        {field.label || field.name} {field.required && '*'}
                      </Label>
                      {field.type === 'textarea' ? (
                        <textarea
                          id={field.name || `field-${index}`}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.name]: e.target.value })
                          }
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          rows={field.rows || 4}
                        />
                      ) : (
                        <Input
                          id={field.name || `field-${index}`}
                          type={field.type || 'text'}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.name]: e.target.value })
                          }
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Este formulario aún no tiene campos configurados</p>
                  </div>
                )}

                {formConfig.fields && formConfig.fields.length > 0 && (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? 'Enviando...' : formConfig.submitButtonText || 'Enviar'}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}


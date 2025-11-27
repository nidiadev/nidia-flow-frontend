'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCustomer } from '@/hooks/use-api';
import { QueryLoading, FormSkeleton } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { CustomerForm } from '@/components/crm/customer-form';
import { Customer } from '@/types/customer';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { Save, X, Loader2 } from 'lucide-react';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const { route } = useTenantRoutes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formSubmitRef = useRef<{ submit: () => void } | null>(null);
  
  const { data: customer, isLoading, isError, error } = useCustomer(customerId);
  
  const handleSuccess = (updatedCustomer: Customer) => {
    setIsSubmitting(false);
    setTimeout(() => {
      router.push(route(`/crm/customers/${updatedCustomer.id}`));
    }, 100);
  };
  
  const handleCancel = () => {
    router.back();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      formSubmitRef.current?.submit();
    } catch (error) {
      // Error is handled by the form, but reset state
      setIsSubmitting(false);
    }
  };

  // Reset submitting state when form errors occur
  const handleFormError = () => {
    setIsSubmitting(false);
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <SectionHeader
          title={customer ? `Editar ${customer.firstName} ${customer.lastName}` : 'Editar Cliente'}
          description="Actualiza la información del cliente"
          showBack
          actions={
            customer && (
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
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
            )
          }
        />

        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={!customer}
          loadingFallback={<FormSkeleton fields={8} />}
          emptyFallback={
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Cliente no encontrado</h3>
              <p className="text-muted-foreground mb-4">
                El cliente que intentas editar no existe o ha sido eliminado
              </p>
              <Button onClick={() => router.push(route('/crm/customers'))}>
                Volver a la lista
              </Button>
            </div>
          }
        >
          {customer && (
            <CustomerForm
              customer={customer}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              onError={handleFormError}
              onSubmitTrigger={formSubmitRef}
              isLoading={isSubmitting}
            />
          )}
        </QueryLoading>
      </div>
    </ErrorBoundary>
  );
}
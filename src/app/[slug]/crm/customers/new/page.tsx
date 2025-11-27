'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { CustomerForm } from '@/components/crm/customer-form';
import { Customer } from '@/types/customer';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { Save, X, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';

export default function NewCustomerPage() {
  const router = useRouter();
  const { route } = useTenantRoutes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formSubmitRef = useRef<{ submit: () => void } | null>(null);
  
  const handleSuccess = (newCustomer: Customer) => {
    setIsSubmitting(false);
    // Small delay to show success state
    setTimeout(() => {
      router.push(route(`/crm/customers/${newCustomer.id}`));
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
      <div>
        <SectionHeader
          title="Nuevo Cliente"
          description="Completa la información para crear un nuevo cliente"
          actions={
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
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
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Crear Cliente
                  </>
                )}
              </Button>
            </div>
          }
        />

        <CustomerForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onError={handleFormError}
          onSubmitTrigger={formSubmitRef}
          isLoading={isSubmitting}
        />
      </div>
    </ErrorBoundary>
  );
}
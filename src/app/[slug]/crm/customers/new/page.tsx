'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SectionHeader } from '@/components/ui/section-header';
import { CustomerForm } from '@/components/crm/customer-form';
import { Customer } from '@/types/customer';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';
import { Save, X } from 'lucide-react';
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

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Trigger form submit via DOM
    const submitButton = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.click();
    } else {
      // Fallback: try form.requestSubmit()
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }
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
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          }
        />

        <CustomerForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onSubmitTrigger={formSubmitRef}
          isLoading={isSubmitting}
        />
      </div>
    </ErrorBoundary>
  );
}
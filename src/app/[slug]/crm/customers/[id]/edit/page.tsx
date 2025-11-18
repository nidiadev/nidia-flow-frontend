'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCustomer } from '@/hooks/use-api';
import { QueryLoading, FormSkeleton } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageHeader } from '@/components/ui/page-header';
import { CustomerForm } from '@/components/crm/customer-form';
import { Customer } from '@/types/customer';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const { route } = useTenantRoutes();
  
  const { data: customer, isLoading, isError, error } = useCustomer(customerId);
  
  const handleSuccess = (updatedCustomer: Customer) => {
    router.push(route(`/crm/customers/${updatedCustomer.id}`));
  };
  
  const handleCancel = () => {
    router.back();
  };

  return (
    <ErrorBoundary>
      <div>
        <PageHeader
          title="Editar Cliente"
          description="Actualiza la información del cliente"
          variant="gradient"
          showBack
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
            />
          )}
        </QueryLoading>
      </div>
    </ErrorBoundary>
  );
}
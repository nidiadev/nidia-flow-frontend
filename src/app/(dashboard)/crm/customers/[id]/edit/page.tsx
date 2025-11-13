'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomer } from '@/hooks/use-api';
import { QueryLoading } from '@/components/ui/loading';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { CustomerForm } from '@/components/crm/customer-form';
import { Customer } from '@/types/customer';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const { data: customer, isLoading, isError, error } = useCustomer(customerId);
  
  const handleSuccess = (updatedCustomer: Customer) => {
    router.push(`/crm/customers/${updatedCustomer.id}`);
  };
  
  const handleCancel = () => {
    router.back();
  };

  return (
    <ErrorBoundary>
      <div>
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <div>
            <h1 className="text-4xl font-bold font-outfit mb-2 bg-gradient-to-r from-nidia-green to-nidia-purple bg-clip-text text-transparent">
              Editar Cliente
            </h1>
            <p className="text-muted-foreground">
              Actualiza la información del cliente
            </p>
          </div>
        </div>

        <QueryLoading
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
          isEmpty={!customer}
          loadingFallback={
            <div className="space-y-6">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/4 mb-4" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="border rounded-lg p-6">
                        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                        <div className="space-y-3">
                          <div className="h-4 bg-muted rounded" />
                          <div className="h-4 bg-muted rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-6">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="border rounded-lg p-6">
                        <div className="h-6 bg-muted rounded w-1/2 mb-4" />
                        <div className="space-y-3">
                          <div className="h-4 bg-muted rounded" />
                          <div className="h-4 bg-muted rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }
          emptyFallback={
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Cliente no encontrado</h3>
              <p className="text-muted-foreground mb-4">
                El cliente que intentas editar no existe o ha sido eliminado
              </p>
              <Button onClick={() => router.push('/crm/customers')}>
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
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { CustomerForm } from '@/components/crm/customer-form';
import { Customer } from '@/types/customer';

export default function NewCustomerPage() {
  const router = useRouter();
  
  const handleSuccess = (newCustomer: Customer) => {
    router.push(`/crm/customers/${newCustomer.id}`);
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
              Nuevo Cliente
            </h1>
            <p className="text-muted-foreground">
              Completa la información para crear un nuevo cliente
            </p>
          </div>
        </div>

        <CustomerForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </ErrorBoundary>
  );
}
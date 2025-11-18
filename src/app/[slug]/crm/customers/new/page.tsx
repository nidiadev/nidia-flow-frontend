'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PageHeader } from '@/components/ui/page-header';
import { FormSkeleton } from '@/components/ui/loading';
import { CustomerForm } from '@/components/crm/customer-form';
import { Customer } from '@/types/customer';
import { useTenantRoutes } from '@/hooks/use-tenant-routes';

export default function NewCustomerPage() {
  const router = useRouter();
  const { route } = useTenantRoutes();
  
  const handleSuccess = (newCustomer: Customer) => {
    router.push(route(`/crm/customers/${newCustomer.id}`));
  };
  
  const handleCancel = () => {
    router.back();
  };

  return (
    <ErrorBoundary>
      <div>
        <PageHeader
          title="Nuevo Cliente"
          description="Completa la información para crear un nuevo cliente"
          variant="gradient"
          showBack
        />

        <CustomerForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </ErrorBoundary>
  );
}
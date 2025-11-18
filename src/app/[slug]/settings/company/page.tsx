'use client';

import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { PageHeader } from '@/components/ui/page-header';
import { FormSkeleton } from '@/components/ui/loading';
import { CompanyForm, CompanyFormRef } from '@/components/settings/company-form';
import { settingsApi, UpdateCompanySettingsDto } from '@/lib/api/settings';
import { toast } from 'sonner';

export default function CompanySettingsPage() {
  const queryClient = useQueryClient();
  const formRef = useRef<CompanyFormRef>(null);

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => settingsApi.getSettings(),
    retry: 1,
    retryOnMount: false,
  });

  // Update settings
  const updateMutation = useMutation({
    mutationFn: (data: UpdateCompanySettingsDto) => settingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success('Configuración actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar la configuración');
    },
  });

  const handleSubmit = async (data: UpdateCompanySettingsDto) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Configuración de Empresa"
          description="Gestiona la información de tu empresa"
          variant="gradient"
        />
        <FormSkeleton fields={10} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <TenantLink href="/settings">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Configuración
        </Button>
      </TenantLink>

      <PageHeader
        title="Configuración de Empresa"
        description="Gestiona la información de tu empresa"
        variant="gradient"
      />

      <CompanyForm
        ref={formRef}
        defaultValues={settingsData}
        onSubmit={handleSubmit}
        onCancel={() => {
          // Reset form to original values
          if (settingsData) {
            formRef.current?.submit();
          }
        }}
        isLoading={updateMutation.isPending}
        showActions={true}
      />
    </motion.div>
  );
}


'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, Mail, MapPin, Loader2 } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { PageHeader } from '@/components/ui/page-header';
import { IntegrationCard } from '@/components/settings/integration-card';
import { settingsApi, UpdateWhatsAppApiKeyDto, UpdateSendGridApiKeyDto, UpdateGoogleMapsApiKeyDto } from '@/lib/api/settings';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function IntegrationsSettingsPage() {
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => settingsApi.getSettings(),
    retry: 1,
    retryOnMount: false,
  });

  // Update WhatsApp API key
  const updateWhatsAppMutation = useMutation({
    mutationFn: (data: UpdateWhatsAppApiKeyDto) => settingsApi.updateWhatsAppApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success('API key de WhatsApp actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar la API key de WhatsApp');
    },
  });

  // Update SendGrid API key
  const updateSendGridMutation = useMutation({
    mutationFn: (data: UpdateSendGridApiKeyDto) => settingsApi.updateSendGridApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success('API key de SendGrid actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar la API key de SendGrid');
    },
  });

  // Update Google Maps API key
  const updateGoogleMapsMutation = useMutation({
    mutationFn: (data: UpdateGoogleMapsApiKeyDto) => settingsApi.updateGoogleMapsApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success('API key de Google Maps actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar la API key de Google Maps');
    },
  });

  const handleWhatsAppSubmit = async (data: { apiKey: string; [key: string]: any }) => {
    await updateWhatsAppMutation.mutateAsync({
      apiKey: data.apiKey,
      phoneId: data.phoneId,
    });
  };

  const handleSendGridSubmit = async (data: { apiKey: string; [key: string]: any }) => {
    await updateSendGridMutation.mutateAsync({
      apiKey: data.apiKey,
      fromEmail: data.fromEmail,
    });
  };

  const handleGoogleMapsSubmit = async (data: { apiKey: string; [key: string]: any }) => {
    await updateGoogleMapsMutation.mutateAsync({
      apiKey: data.apiKey,
    });
  };

  const isWhatsAppConfigured = !!settingsData?.whatsappApiKey;
  const isSendGridConfigured = !!settingsData?.sendgridApiKey;
  const isGoogleMapsConfigured = !!settingsData?.googleMapsApiKey;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Integraciones"
          description="Configura integraciones con servicios externos"
          variant="gradient"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
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
        title="Integraciones"
        description="Configura integraciones con servicios externos para habilitar funcionalidades adicionales"
        variant="gradient"
      />

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información sobre Integraciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Las integraciones te permiten conectar Nidia Flow con servicios externos para habilitar
              funcionalidades como envío de mensajes, emails y mapas.
            </p>
            <p>
              <strong>Importante:</strong> Las API keys se almacenan de forma segura y enmascaradas.
              Solo necesitas actualizarlas si cambias de cuenta o necesitas renovar las credenciales.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Integration Cards */}
      <div className="space-y-4">
        <IntegrationCard
          title="WhatsApp Business"
          description="Conecta tu cuenta de WhatsApp Business para enviar mensajes a tus clientes"
          icon={<MessageSquare className="h-6 w-6 text-green-600" />}
          isConfigured={isWhatsAppConfigured}
          apiKey={settingsData?.whatsappApiKey}
          onSubmit={handleWhatsAppSubmit}
          isLoading={updateWhatsAppMutation.isPending}
          additionalFields={[
            {
              name: 'phoneId',
              label: 'Phone ID (Opcional)',
              placeholder: 'Ingresa el ID del teléfono de WhatsApp Business',
              description: 'ID del número de teléfono asociado a tu cuenta de WhatsApp Business',
            },
          ]}
        />

        <IntegrationCard
          title="SendGrid"
          description="Conecta tu cuenta de SendGrid para enviar emails transaccionales y de marketing"
          icon={<Mail className="h-6 w-6 text-blue-600" />}
          isConfigured={isSendGridConfigured}
          apiKey={settingsData?.sendgridApiKey}
          onSubmit={handleSendGridSubmit}
          isLoading={updateSendGridMutation.isPending}
          additionalFields={[
            {
              name: 'fromEmail',
              label: 'Email Remitente (Opcional)',
              placeholder: 'noreply@tudominio.com',
              type: 'email',
              description: 'Email desde el cual se enviarán los correos (debe estar verificado en SendGrid)',
            },
          ]}
        />

        <IntegrationCard
          title="Google Maps"
          description="Conecta tu API key de Google Maps para habilitar funcionalidades de geolocalización y mapas"
          icon={<MapPin className="h-6 w-6 text-red-600" />}
          isConfigured={isGoogleMapsConfigured}
          apiKey={settingsData?.googleMapsApiKey}
          onSubmit={handleGoogleMapsSubmit}
          isLoading={updateGoogleMapsMutation.isPending}
        />
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>¿Necesitas ayuda?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>WhatsApp Business:</strong> Obtén tu API key desde el{' '}
              <a
                href="https://developers.facebook.com/docs/whatsapp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Meta for Developers
              </a>
            </p>
            <p>
              <strong>SendGrid:</strong> Crea una API key desde tu{' '}
              <a
                href="https://app.sendgrid.com/settings/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                panel de SendGrid
              </a>
            </p>
            <p>
              <strong>Google Maps:</strong> Obtén tu API key desde{' '}
              <a
                href="https://console.cloud.google.com/google/maps-apis"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Cloud Console
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

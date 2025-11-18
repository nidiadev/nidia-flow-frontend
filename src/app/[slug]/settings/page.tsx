'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Settings as SettingsIcon } from 'lucide-react';
import { TenantLink } from '@/components/ui/tenant-link';
import { PageHeader } from '@/components/ui/page-header';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuración"
        description="Gestiona la configuración de tu empresa"
        variant="gradient"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TenantLink href="/settings/company">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-nidia-green" />
                <CardTitle className="text-base">Empresa</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Información de la empresa, datos fiscales y configuración general
              </p>
            </CardContent>
          </Card>
        </TenantLink>

        <TenantLink href="/settings/users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-nidia-purple" />
                <CardTitle className="text-base">Usuarios</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gestiona usuarios, roles y permisos de tu organización
              </p>
            </CardContent>
          </Card>
        </TenantLink>

        <TenantLink href="/settings/integrations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-nidia-blue" />
                <CardTitle className="text-base">Integraciones</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configura integraciones con servicios externos
              </p>
            </CardContent>
          </Card>
        </TenantLink>
      </div>
    </div>
  );
}


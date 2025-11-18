'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plug, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import Link from 'next/link';

export default function IntegrationsSettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href="/superadmin/settings">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Configuración
        </Button>
      </Link>
      
      <PageHeader
        title="Integraciones"
        description="Configurar integraciones con servicios externos"
      />

      <Card>
        <CardHeader>
          <CardTitle>Integraciones</CardTitle>
          <CardDescription>
            Conecta el sistema con servicios externos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configuración de integraciones próximamente disponible
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}


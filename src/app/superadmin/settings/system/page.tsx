'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cog, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SystemSettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <Link href="/superadmin/settings">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Configuración
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mb-2">Configuración del Sistema</h1>
        <p className="text-muted-foreground">
          Ajustes generales del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración del Sistema</CardTitle>
          <CardDescription>
            Ajustes y parámetros generales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configuración del sistema próximamente disponible
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}


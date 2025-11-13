'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Cog, Plug, FileText } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Configuración</h1>
        <p className="text-muted-foreground">
          Configuración general del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/superadmin/settings/system">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cog className="h-5 w-5 text-nidia-green" />
                <CardTitle className="text-base">Sistema</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configuración general del sistema
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/superadmin/settings/integrations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-nidia-purple" />
                <CardTitle className="text-base">Integraciones</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configurar integraciones externas
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/superadmin/settings/logs">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-nidia-blue" />
                <CardTitle className="text-base">Logs</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ver y gestionar logs del sistema
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </motion.div>
  );
}


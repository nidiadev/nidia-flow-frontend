'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTenantPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <Link href="/superadmin/tenants">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Clientes
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mb-2">Crear Nuevo Cliente</h1>
        <p className="text-muted-foreground">
          Registra una nueva empresa en el sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
          <CardDescription>
            Completa los datos de la nueva empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Empresa</Label>
                <Input id="name" placeholder="Ej: Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdominio</Label>
                <Input id="subdomain" placeholder="acme" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email de Contacto</Label>
                <Input id="email" type="email" placeholder="contacto@acme.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" type="tel" placeholder="+1 234 567 8900" />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit">Crear Cliente</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/superadmin/tenants">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}


'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPlanPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <Link href="/superadmin/plans">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Planes
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mb-2">Crear Nuevo Plan</h1>
        <p className="text-muted-foreground">
          Configura un nuevo plan de suscripción
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Plan</CardTitle>
          <CardDescription>
            Define las características y precios del plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Plan</Label>
                <Input id="name" placeholder="Ej: Plan Básico" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre para Mostrar</Label>
                <Input id="displayName" placeholder="Ej: Plan Básico" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceMonthly">Precio Mensual</Label>
                <Input id="priceMonthly" type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceYearly">Precio Anual</Label>
                <Input id="priceYearly" type="number" placeholder="0.00" />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit">Crear Plan</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/superadmin/plans">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}


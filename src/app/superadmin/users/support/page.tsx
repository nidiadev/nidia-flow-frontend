'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SystemUsersTable } from '@/components/system-users/system-users-table';
import { systemUsersApi } from '@/lib/api/system-users';

export default function SupportUsersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['system-users', 'support'],
    queryFn: () => systemUsersApi.list({ systemRole: 'support', limit: 50 }),
    retry: 1,
    retryOnMount: false,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const users = data?.data || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link href="/superadmin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios de Soporte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Usuarios con permisos de soporte para ayudar a los clientes
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios de Soporte</CardTitle>
          <CardDescription>
            Lista de todos los usuarios de soporte del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12 text-destructive">
              <p>Error al cargar usuarios de soporte</p>
              <p className="text-sm mt-2 text-muted-foreground">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          ) : (
            <SystemUsersTable
              data={users}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

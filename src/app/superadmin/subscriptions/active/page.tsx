'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SubscriptionsTable } from '@/components/subscriptions/subscriptions-table';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import { useRouter } from 'next/navigation';

export default function ActiveSubscriptionsPage() {
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: () => subscriptionsApi.list({ status: 'active', limit: 50 }),
    retry: 1,
    retryOnMount: false,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const subscriptions = data?.data || [];
  
  // Filtrar solo las que no han expirado
  const activeSubscriptions = subscriptions.filter((s) => {
    const endDate = new Date(s.currentPeriodEnd);
    return s.status === 'active' && endDate >= new Date();
  });

  const handleView = (subscription: any) => {
    router.push(`/superadmin/subscriptions/${subscription.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link href="/superadmin/subscriptions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Suscripciones
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suscripciones Activas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lista de todas las suscripciones activas y vigentes
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suscripciones Activas</CardTitle>
          <CardDescription>
            Todas las suscripciones actualmente activas en el sistema ({activeSubscriptions.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12 text-destructive">
              <p>Error al cargar suscripciones activas</p>
              <p className="text-sm mt-2 text-muted-foreground">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          ) : (
            <SubscriptionsTable
              data={activeSubscriptions}
              isLoading={isLoading}
              onView={handleView}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}


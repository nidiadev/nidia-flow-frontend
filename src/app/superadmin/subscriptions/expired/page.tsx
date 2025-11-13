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

export default function ExpiredSubscriptionsPage() {
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscriptions', 'expired'],
    queryFn: () => subscriptionsApi.list({ status: 'active', limit: 50 }),
    retry: 1,
    retryOnMount: false,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const subscriptions = data?.data || [];
  
  // Filtrar solo las que han expirado
  const expiredSubscriptions = subscriptions.filter((s) => {
    const endDate = new Date(s.currentPeriodEnd);
    return s.status === 'active' && endDate < new Date();
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
          <h1 className="text-2xl font-semibold tracking-tight">Suscripciones Vencidas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lista de suscripciones que han expirado y requieren atención
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suscripciones Vencidas</CardTitle>
          <CardDescription>
            Suscripciones que requieren renovación o atención ({expiredSubscriptions.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12 text-destructive">
              <p>Error al cargar suscripciones vencidas</p>
              <p className="text-sm mt-2 text-muted-foreground">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          ) : (
            <SubscriptionsTable
              data={expiredSubscriptions}
              isLoading={isLoading}
              onView={handleView}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}


'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
} from 'lucide-react';
import { subscriptionsApi, Subscription } from '@/lib/api/subscriptions';
import { plansApi, Plan } from '@/lib/api/plans';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function EditSubscriptionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const subscriptionId = params.id as string;

  const [formData, setFormData] = useState({
    planId: '',
    billingCycle: 'monthly',
    amount: '',
    discountAmount: '',
    status: 'active',
    cancelAtPeriodEnd: false,
    cancellationReason: '',
    currentPeriodStart: '',
    currentPeriodEnd: '',
    trialStart: '',
    trialEnd: '',
  });

  // Fetch subscription details - actualización en tiempo real
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription', subscriptionId],
    queryFn: () => subscriptionsApi.getById(subscriptionId),
    enabled: !!subscriptionId,
    retry: 1,
    retryOnMount: false,
    refetchInterval: 5000, // Refrescar cada 5 segundos para actualización en tiempo real
    refetchOnWindowFocus: true, // Refrescar cuando la ventana recupera el foco
  });

  // Fetch plans for dropdown
  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list(),
  });

  const plans = plansData || [];

  // Update form when subscription loads
  useEffect(() => {
    if (subscription) {
      setFormData({
        planId: subscription.planId || '',
        billingCycle: subscription.billingCycle || 'monthly',
        amount: String(subscription.amount || 0),
        discountAmount: String(subscription.discountAmount || 0),
        status: subscription.status || 'active',
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        cancellationReason: subscription.cancellationReason || '',
        currentPeriodStart: subscription.currentPeriodStart
          ? format(new Date(subscription.currentPeriodStart), "yyyy-MM-dd'T'HH:mm")
          : '',
        currentPeriodEnd: subscription.currentPeriodEnd
          ? format(new Date(subscription.currentPeriodEnd), "yyyy-MM-dd'T'HH:mm")
          : '',
        trialStart: subscription.trialStart
          ? format(new Date(subscription.trialStart), "yyyy-MM-dd'T'HH:mm")
          : '',
        trialEnd: subscription.trialEnd
          ? format(new Date(subscription.trialEnd), "yyyy-MM-dd'T'HH:mm")
          : '',
      });
    }
  }, [subscription]);

  // Update mutation con actualización optimista
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Subscription>) =>
      subscriptionsApi.update(subscriptionId, data),
    onSuccess: (updatedSubscription) => {
      // Invalidar queries para forzar refetch
      queryClient.invalidateQueries({ queryKey: ['subscription', subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      
      // Actualizar optimísticamente la cache de la suscripción individual
      queryClient.setQueryData(['subscription', subscriptionId], updatedSubscription);
      
      toast.success('Suscripción actualizada exitosamente');
      router.push(`/superadmin/subscriptions/${subscriptionId}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar suscripción');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatePayload: any = {
      planId: formData.planId,
      billingCycle: formData.billingCycle,
      amount: parseFloat(formData.amount),
      discountAmount: parseFloat(formData.discountAmount),
      status: formData.status,
      cancelAtPeriodEnd: formData.cancelAtPeriodEnd,
      cancellationReason: formData.cancellationReason || undefined,
      currentPeriodStart: formData.currentPeriodStart,
      currentPeriodEnd: formData.currentPeriodEnd,
      trialStart: formData.trialStart || undefined,
      trialEnd: formData.trialEnd || undefined,
    };

    updateMutation.mutate(updatePayload);
  };

  if (isLoadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Suscripción no encontrada</h2>
          <Button onClick={() => router.push('/superadmin/subscriptions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Suscripciones
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/superadmin/subscriptions/${subscriptionId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Detalle
        </Button>
        <h1 className="text-3xl font-bold font-outfit mb-2 text-foreground">
          Editar Suscripción
        </h1>
        <p className="text-muted-foreground text-lg">
          Modifica los datos de la suscripción
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Datos principales de la suscripción</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="planId">Plan</Label>
                <Select
                  value={formData.planId}
                  onValueChange={(value) => setFormData({ ...formData, planId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan: Plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingCycle">Ciclo de Facturación</Label>
                <Select
                  value={formData.billingCycle}
                  onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="semiannually">Semestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="trialing">En Trial</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="past_due">Vencida</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Información de Facturación */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Facturación</CardTitle>
              <CardDescription>Montos y precios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto Base</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountAmount">Descuento</Label>
                <Input
                  id="discountAmount"
                  type="number"
                  step="0.01"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Período Actual */}
          <Card>
            <CardHeader>
              <CardTitle>Período Actual</CardTitle>
              <CardDescription>Fechas del período de facturación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPeriodStart">Inicio del Período</Label>
                <Input
                  id="currentPeriodStart"
                  type="datetime-local"
                  value={formData.currentPeriodStart}
                  onChange={(e) => setFormData({ ...formData, currentPeriodStart: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPeriodEnd">Fin del Período</Label>
                <Input
                  id="currentPeriodEnd"
                  type="datetime-local"
                  value={formData.currentPeriodEnd}
                  onChange={(e) => setFormData({ ...formData, currentPeriodEnd: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Período de Trial */}
          <Card>
            <CardHeader>
              <CardTitle>Período de Trial</CardTitle>
              <CardDescription>Fechas del período de prueba (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trialStart">Inicio del Trial</Label>
                <Input
                  id="trialStart"
                  type="datetime-local"
                  value={formData.trialStart}
                  onChange={(e) => setFormData({ ...formData, trialStart: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialEnd">Fin del Trial</Label>
                <Input
                  id="trialEnd"
                  type="datetime-local"
                  value={formData.trialEnd}
                  onChange={(e) => setFormData({ ...formData, trialEnd: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cancelación */}
          <Card>
            <CardHeader>
              <CardTitle>Cancelación</CardTitle>
              <CardDescription>Configuración de cancelación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="cancelAtPeriodEnd">Cancelar al Finalizar Período</Label>
                  <p className="text-sm text-muted-foreground">
                    La suscripción se cancelará al finalizar el período actual
                  </p>
                </div>
                <Switch
                  id="cancelAtPeriodEnd"
                  checked={formData.cancelAtPeriodEnd}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, cancelAtPeriodEnd: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellationReason">Razón de Cancelación</Label>
                <Textarea
                  id="cancellationReason"
                  value={formData.cancellationReason}
                  onChange={(e) =>
                    setFormData({ ...formData, cancellationReason: e.target.value })
                  }
                  placeholder="Razón por la cual se canceló la suscripción..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/superadmin/subscriptions/${subscriptionId}`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}


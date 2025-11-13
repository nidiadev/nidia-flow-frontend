import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  plan: {
    id: string;
    name: string;
    displayName: string;
    enabledModules: string[];
    features: string[];
  };
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface SubscriptionResponse {
  success: boolean;
  data: Subscription;
}

/**
 * Hook para obtener la suscripción activa del tenant actual
 */
export function useSubscription() {
  return useQuery<Subscription, Error>({
    queryKey: queryKeys.subscription.current(),
    queryFn: async () => {
      try {
        const response = await api.get<SubscriptionResponse>('/subscriptions/current');
        return response.data.data || response.data;
      } catch (error: any) {
        // Si no hay suscripción activa, retornar valores por defecto
        if (error.response?.status === 404) {
          return {
            id: '',
            tenantId: '',
            planId: '',
            plan: {
              id: '',
              name: 'free',
              displayName: 'Plan Gratuito',
              enabledModules: ['crm', 'tasks'], // Módulos básicos por defecto
              features: ['basic_crm', 'basic_tasks'],
            },
            status: 'active' as const,
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date().toISOString(),
          };
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });
}

/**
 * Hook para verificar si un módulo está habilitado
 */
export function useModuleEnabled(moduleName: string) {
  const { data: subscription } = useSubscription();
  
  if (!subscription) {
    return false;
  }

  return subscription.plan.enabledModules.includes(moduleName);
}


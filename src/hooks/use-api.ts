'use client';

import React from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query';
import { ApiClient, ApiResponse } from '@/lib/api';
import { queryKeys, cacheUtils } from '@/lib/query-client';
import { dealStagesApi } from '@/lib/api/crm';
import { toast } from 'sonner';

// Generic API query hook
export function useApiQuery<TData = any, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  options?: Omit<UseQueryOptions<ApiResponse<TData>, TError, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn,
    select: (data) => data.data, // Extract data from ApiResponse wrapper
    ...options,
  });
}

// Generic API mutation hook
export function useApiMutation<TData = any, TVariables = any, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<ApiResponse<TData>, TError, TVariables>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context, mutation) => {
      // Show success message if provided
      if (data.message) {
        toast.success(data.message);
      }
      
      // Call custom onSuccess handler
      options?.onSuccess?.(data, variables, context, mutation);
    },
    onError: (error, variables, context, mutation) => {
      // Error handling is done by the API interceptor
      // Call custom onError handler
      options?.onError?.(error, variables, context, mutation);
    },
    ...options,
  });
}

// Auth hooks
export function useCurrentUser() {
  return useApiQuery(
    queryKeys.auth.me(),
    () => ApiClient.get('/auth/me'),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
    }
  );
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (credentials: { email: string; password: string }) => 
      ApiClient.post('/auth/login', credentials),
    {
      onSuccess: (data) => {
        // Invalidate and refetch user data
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
        toast.success('¡Bienvenido de vuelta!');
      },
    }
  );
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    () => ApiClient.post('/auth/logout'),
    {
      onSuccess: () => {
        // Clear all cached data
        queryClient.clear();
        toast.success('Sesión cerrada correctamente');
      },
    }
  );
}

// CRM hooks
export function useCustomers(filters?: any) {
  return useQuery({
    queryKey: queryKeys.crm.customers(filters),
    queryFn: async () => {
      const response = await ApiClient.get('/crm/customers', { params: filters });
      return {
        data: response.data || [],
        pagination: response.pagination,
      };
    },
    placeholderData: (previousData) => previousData,
    select: (response) => response.data, // Extract just the data array for backward compatibility
  });
}

export function useCustomersWithPagination(filters?: any) {
  return useQuery({
    queryKey: queryKeys.crm.customers(filters),
    queryFn: async () => {
      const response = await ApiClient.get('/crm/customers', { params: filters });
      return {
        data: response.data || [],
        pagination: response.pagination || {
          page: filters?.page || 1,
          limit: filters?.limit || 20,
          total: response.data?.length || 0,
          totalPages: 1,
        },
      };
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useCustomerStatistics() {
  return useApiQuery(
    queryKeys.crm.statistics(),
    () => ApiClient.get('/crm/customers/statistics'),
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );
}

export function useCustomer(id: string) {
  return useApiQuery(
    queryKeys.crm.customer(id),
    () => ApiClient.get(`/crm/customers/${id}`),
    {
      enabled: !!id, // Only run query if id is provided
    }
  );
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (customerData: any) => ApiClient.post('/crm/customers', customerData),
    {
      onSuccess: () => {
        // Invalidate customers list and statistics
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.customers() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.statistics() });
      },
    }
  );
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    ({ id, data }: { id: string; data: any }) => 
      ApiClient.put(`/crm/customers/${id}`, data),
    {
      onSuccess: (_, { id }) => {
        // Invalidate specific customer, list, and statistics
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.customer(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.customers() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.statistics() });
      },
    }
  );
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (id: string) => ApiClient.delete(`/crm/customers/${id}`),
    {
      onSuccess: (_, id) => {
        // Remove from cache and invalidate list and statistics
        queryClient.removeQueries({ queryKey: queryKeys.crm.customer(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.customers() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.statistics() });
      },
    }
  );
}

// Interactions hooks
export function useCustomerInteractions(customerId: string) {
  return useApiQuery(
    queryKeys.crm.interactions(customerId),
    () => ApiClient.get(`/crm/interactions/customer/${customerId}`),
    {
      enabled: !!customerId,
      placeholderData: (previousData) => previousData,
    }
  );
}

// Customer Notes hooks
export function useCreateCustomerNote() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (noteData: { customerId: string; content: string; isInternal?: boolean }) => 
      ApiClient.post('/crm/customer-notes', noteData),
    {
      onSuccess: (_, variables) => {
        // Invalidate notes for the customer
        if (variables.customerId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.crm.customerNotes(variables.customerId) });
        }
        // Also invalidate customer data
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.customer(variables.customerId) });
      },
    }
  );
}

export function useCustomerNotes(customerId: string) {
  return useApiQuery(
    queryKeys.crm.customerNotes(customerId),
    () => ApiClient.get(`/crm/customer-notes/customer/${customerId}`),
    {
      enabled: !!customerId,
      placeholderData: (previousData) => previousData,
    }
  );
}

// Customer Contacts hooks
export function useCustomerContacts(filters?: {
  search?: string;
  customerId?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.customerId) params.append('customerId', filters.customerId);
  if (filters?.includeInactive) params.append('includeInactive', 'true');
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const queryString = params.toString();
  const url = `/crm/contacts${queryString ? `?${queryString}` : ''}`;
  
  return useQuery({
    queryKey: queryKeys.crm.customerContacts(filters),
    queryFn: async () => {
      const response = await ApiClient.get<{
        data: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(url);
      // La respuesta del API es: { success: true, data: { data: [...], pagination: {...} } }
      // Retornamos directamente response.data que contiene { data: [...], pagination: {...} }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

// Get contacts for a specific customer
export function useCustomerContactsByCustomer(customerId: string, includeInactive?: boolean) {
  return useApiQuery(
    ['crm', 'customers', customerId, 'contacts', { includeInactive }],
    async () => {
      const params = new URLSearchParams();
      if (includeInactive) params.append('includeInactive', 'true');
      const queryString = params.toString();
      const url = `/crm/customers/${customerId}/contacts${queryString ? `?${queryString}` : ''}`;
      return ApiClient.get<any[]>(url);
    }
  );
}

// Create customer contact
export function useCreateCustomerContact() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (contactData: { customerId: string; firstName: string; lastName?: string; position?: string; department?: string; email?: string; phone?: string; mobile?: string; isPrimary?: boolean; isActive?: boolean; notes?: string }) => 
      ApiClient.post(`/crm/customers/${contactData.customerId}/contacts`, contactData),
    {
      onSuccess: (_, variables) => {
        // Invalidate contacts for the customer
        queryClient.invalidateQueries({ queryKey: ['crm', 'customers', variables.customerId, 'contacts'] });
        // Also invalidate all contacts list
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.customerContacts() });
        // Invalidate customer data
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.customer(variables.customerId) });
      },
    }
  );
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (interactionData: any) => ApiClient.post('/crm/interactions', interactionData),
    {
      onSuccess: (_, variables) => {
        // Invalidate interactions for the customer
        if (variables.customerId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.crm.interactions(variables.customerId) });
        }
        // Also invalidate customer data to update lastContactAt
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.customer(variables.customerId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.statistics() });
      },
    }
  );
}

// Products hooks
export function useProducts(filters?: any) {
  return useApiQuery(
    queryKeys.products.list(filters),
    () => ApiClient.get('/products', { params: filters }),
    {
      placeholderData: (previousData) => previousData,
    }
  );
}

export function useProduct(id: string) {
  return useApiQuery(
    queryKeys.products.detail(id),
    () => ApiClient.get(`/products/${id}`),
    {
      enabled: !!id,
    }
  );
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (productData: any) => ApiClient.post('/products', productData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      },
    }
  );
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    ({ id, data }: { id: string; data: any }) => 
      ApiClient.put(`/products/${id}`, data),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
      },
    }
  );
}

// Orders hooks
export function useOrders(filters?: any) {
  return useApiQuery(
    queryKeys.orders.list(filters),
    () => ApiClient.get('/orders', { params: filters }),
    {
      placeholderData: (previousData) => previousData,
    }
  );
}

export function useOrder(id: string) {
  return useApiQuery(
    queryKeys.orders.detail(id),
    () => ApiClient.get(`/orders/${id}`),
    {
      enabled: !!id,
    }
  );
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (orderData: any) => ApiClient.post('/orders', orderData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
        // Also invalidate related data
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }); // For inventory updates
      },
    }
  );
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    ({ id, data }: { id: string; data: any }) => 
      ApiClient.put(`/orders/${id}`, data),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
      },
    }
  );
}

// Tasks hooks
export function useTasks(filters?: any) {
  return useApiQuery(
    queryKeys.tasks.list(filters),
    () => ApiClient.get('/tasks', { params: filters }),
    {
      placeholderData: (previousData) => previousData,
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    }
  );
}

export function useTask(id: string) {
  return useApiQuery(
    queryKeys.tasks.detail(id),
    () => ApiClient.get(`/tasks/${id}`),
    {
      enabled: !!id,
      refetchInterval: 10000, // Refetch every 10 seconds for task details
    }
  );
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (taskData: any) => ApiClient.post('/tasks', taskData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() });
      },
    }
  );
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    ({ id, data }: { id: string; data: any }) => 
      ApiClient.put(`/tasks/${id}`, data),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list() });
      },
    }
  );
}

// Dashboard hooks
export function useDashboardData(period?: string) {
  return useApiQuery(
    queryKeys.reports.dashboard(period),
    () => ApiClient.get('/reports/dashboard', { params: { period } }),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for dashboard data
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );
}

// Settings hooks
export function useCompanySettings() {
  return useApiQuery(
    queryKeys.settings.company(),
    () => ApiClient.get('/settings/company'),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (settingsData: any) => ApiClient.put('/settings/company', settingsData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.company() });
      },
    }
  );
}

// Utility hooks
export function usePrefetchQuery<TData = any>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  condition: boolean = true
) {
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    if (condition) {
      cacheUtils.prefetch([...queryKey], queryFn);
    }
  }, [queryKey, queryFn, condition, queryClient]);
}

// Optimistic updates hook
export function useOptimisticUpdate<TData = any>(
  queryKey: QueryKey,
  updateFn: (oldData: TData, newData: Partial<TData>) => TData
) {
  const queryClient = useQueryClient();
  
  const updateOptimistically = React.useCallback((newData: Partial<TData>) => {
    queryClient.setQueryData(queryKey, (oldData: TData) => {
      if (!oldData) return oldData;
      return updateFn(oldData, newData);
    });
  }, [queryClient, queryKey, updateFn]);
  
  const revert = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);
  
  return { updateOptimistically, revert };
}

// Deals hooks
export function useDeals(filters?: {
  page?: number;
  limit?: number;
  status?: string;
  stageId?: string;
  assignedTo?: string;
  customerId?: string;
  search?: string;
}) {
  return useApiQuery(
    queryKeys.crm.deals.all(filters),
    () => ApiClient.get('/crm/deals', { params: filters }),
    {
      placeholderData: (previousData) => previousData,
    }
  );
}

export function useDeal(id: string) {
  return useApiQuery(
    queryKeys.crm.deals.detail(id),
    () => ApiClient.get(`/crm/deals/${id}`),
    {
      enabled: !!id,
    }
  );
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (dealData: any) => ApiClient.post('/crm/deals', dealData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.statistics() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.pipeline() });
      },
    }
  );
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    ({ id, data }: { id: string; data: any }) => 
      ApiClient.put(`/crm/deals/${id}`, data),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.detail(id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.statistics() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.pipeline() });
      },
    }
  );
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (id: string) => ApiClient.delete(`/crm/deals/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.statistics() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.pipeline() });
      },
    }
  );
}

export function useChangeDealStage() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    ({ dealId, stageId }: { dealId: string; stageId: string }) => 
      ApiClient.patch(`/crm/deals/${dealId}/stage`, { stageId }),
    {
      onSuccess: (_, { dealId }) => {
        // Invalidate all deal-related queries - use prefix matching to catch all filters
        queryClient.invalidateQueries({ 
          queryKey: ['crm', 'deals'],
          exact: false, // This will match all queries starting with ['crm', 'deals']
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deal(dealId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.statistics() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.pipeline() });
      },
    }
  );
}

export function useWinDeal() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    ({ dealId, data }: { dealId: string; data?: { notes?: string; closedAt?: string } }) => 
      ApiClient.patch(`/crm/deals/${dealId}/win`, data || {}),
    {
      onSuccess: (_, { dealId }) => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'deals'], exact: false });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deal(dealId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.statistics() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.pipeline() });
      },
    }
  );
}

export function useLoseDeal() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    ({ dealId, reason, notes }: { dealId: string; reason: string; notes?: string }) => 
      ApiClient.patch(`/crm/deals/${dealId}/lose`, { reason, notes }),
    {
      onSuccess: (_, { dealId }) => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'deals'], exact: false });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deal(dealId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.deals.statistics() });
        queryClient.invalidateQueries({ queryKey: queryKeys.crm.pipeline() });
      },
    }
  );
}

// Deal Stages hooks
export function useDealStages() {
  return useApiQuery(
    queryKeys.crm.dealStages.all(),
    async () => {
      // Use dealStagesApi.getAll which already uses ApiClient.get
      const response = await dealStagesApi.getAll();
      // Debug: Log response structure
      console.log('[useDealStages] API Response:', response);
      return response;
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - stages don't change often
      retry: 2,
    }
  );
}
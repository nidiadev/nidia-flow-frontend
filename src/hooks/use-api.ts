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
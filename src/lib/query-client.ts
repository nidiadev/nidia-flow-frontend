import { QueryClient, DefaultOptions, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';

// Enhanced query configuration
const queryConfig: DefaultOptions = {
  queries: {
    // Cache configuration
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes after last use
    
    // Retry configuration with smart logic
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      
      // Don't retry on client errors except timeout and rate limit
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        if (error?.response?.status === 408 || error?.response?.status === 429) {
          return failureCount < 2;
        }
        return false;
      }
      
      // Retry on network errors and server errors
      return failureCount < 3;
    },
    
    // Exponential backoff with jitter
    retryDelay: (attemptIndex) => {
      const baseDelay = Math.min(1000 * 2 ** attemptIndex, 30000);
      const jitter = Math.random() * 0.1 * baseDelay;
      return baseDelay + jitter;
    },
    
    // Refetch configuration
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    
    // Network mode
    networkMode: 'online',
  },
  
  mutations: {
    // Don't retry mutations by default to avoid duplicate operations
    retry: (failureCount, error: any) => {
      // Only retry on network errors or server errors, not client errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 1; // Only retry once for mutations
    },
    
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    
    networkMode: 'online',
  },
};

// Global error handler for queries
const queryCache = new QueryCache({
  onError: (error: any, query) => {
    // Only show error toasts for background refetches, not initial loads
    if (query.state.data !== undefined) {
      console.error('Query error:', error);
      
      // Don't show toast for auth errors (handled by interceptor)
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        toast.error('Error al cargar datos. Reintentando...');
      }
    }
  },
});

// Global error handler for mutations
const mutationCache = new MutationCache({
  onError: (error: any, _variables, _context, _mutation) => {
    console.error('Mutation error:', error);
    
    // Don't show toast for auth errors (handled by interceptor)
    if (error?.response?.status !== 401 && error?.response?.status !== 403) {
      const errorMessage = error?.response?.data?.message || 'Error al procesar la solicitud';
      toast.error(errorMessage);
    }
  },
  
  onSuccess: (data: any, _variables, _context, _mutation) => {
    // Show success message for mutations if provided
    if (data?.message) {
      toast.success(data.message);
    }
  },
});

// Create enhanced query client
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
  queryCache,
  mutationCache,
});

// Query key factory for consistent key generation
export const queryKeys = {
  // Auth
  auth: {
    me: () => ['auth', 'me'] as const,
    permissions: () => ['auth', 'permissions'] as const,
  },
  
  // CRM
  crm: {
    all: () => ['crm'] as const,
    customers: (filters?: any) => ['crm', 'customers', filters] as const,
    customer: (id: string) => ['crm', 'customers', id] as const,
    statistics: () => ['crm', 'customers', 'statistics'] as const,
    interactions: (customerId?: string) => ['crm', 'interactions', customerId] as const,
    customerNotes: (customerId?: string) => ['crm', 'customer-notes', customerId] as const,
    customerContacts: (filters?: any) => ['crm', 'customer-contacts', filters] as const,
    deals: {
      all: (filters?: any) => ['crm', 'deals', filters] as const,
      detail: (id: string) => ['crm', 'deals', id] as const,
      statistics: () => ['crm', 'deals', 'statistics'] as const,
    },
    deal: (id: string) => ['crm', 'deals', id] as const,
    dealStages: {
      all: () => ['crm', 'deal-stages'] as const,
      detail: (id: string) => ['crm', 'deal-stages', id] as const,
    },
    pipeline: () => ['crm', 'pipeline'] as const,
    inbox: {
      conversations: (filters?: any) => ['crm', 'inbox', 'conversations', filters] as const,
      conversation: (id: string) => ['crm', 'inbox', 'conversations', id] as const,
      messages: (conversationId: string) => ['crm', 'inbox', 'conversations', conversationId, 'messages'] as const,
      stats: () => ['crm', 'inbox', 'stats'] as const,
    },
    calendar: {
      view: (view: string, date: string, filters?: any) => ['crm', 'calendar', 'view', view, date, filters] as const,
      today: () => ['crm', 'calendar', 'today'] as const,
    },
  },
  
  // Products
  products: {
    all: () => ['products'] as const,
    list: (filters?: any) => ['products', 'list', filters] as const,
    detail: (id: string) => ['products', id] as const,
    categories: () => ['products', 'categories'] as const,
    inventory: (productId?: string) => ['products', 'inventory', productId] as const,
  },
  
  // Orders
  orders: {
    all: () => ['orders'] as const,
    list: (filters?: any) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', id] as const,
    payments: (orderId: string) => ['orders', orderId, 'payments'] as const,
  },
  
  // Tasks
  tasks: {
    all: () => ['tasks'] as const,
    list: (filters?: any) => ['tasks', 'list', filters] as const,
    detail: (id: string) => ['tasks', id] as const,
    assigned: (userId?: string) => ['tasks', 'assigned', userId] as const,
  },
  
  // Reports
  reports: {
    all: () => ['reports'] as const,
    dashboard: (period?: string) => ['reports', 'dashboard', period] as const,
    sales: (filters?: any) => ['reports', 'sales', filters] as const,
    financial: (filters?: any) => ['reports', 'financial', filters] as const,
  },
  
  // Settings
  settings: {
    company: () => ['settings', 'company'] as const,
    users: () => ['settings', 'users'] as const,
    roles: () => ['settings', 'roles'] as const,
  },
  
  // Subscription
  subscription: {
    current: () => ['subscription', 'current'] as const,
  },
} as const;

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries for a specific entity
  invalidateEntity: (entity: keyof typeof queryKeys) => {
    const entityKeys = queryKeys[entity];
    if (entityKeys && 'all' in entityKeys && typeof entityKeys.all === 'function') {
      return queryClient.invalidateQueries({ queryKey: entityKeys.all() as unknown as any[] });
    }
    // For entities without 'all', invalidate by entity name
    return queryClient.invalidateQueries({ queryKey: [entity] });
  },
  
  // Remove all queries for a specific entity
  removeEntity: (entity: keyof typeof queryKeys) => {
    const entityKeys = queryKeys[entity];
    if (entityKeys && 'all' in entityKeys && typeof entityKeys.all === 'function') {
      return queryClient.removeQueries({ queryKey: entityKeys.all() as unknown as any[] });
    }
    // For entities without 'all', remove by entity name
    return queryClient.removeQueries({ queryKey: [entity] });
  },
  
  // Prefetch data
  prefetch: async (queryKey: any[], queryFn: () => Promise<any>) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
  
  // Set query data manually
  setQueryData: <T>(queryKey: any[], data: T) => {
    return queryClient.setQueryData(queryKey, data);
  },
  
  // Get cached query data
  getQueryData: <T>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },
  
  // Clear all cache
  clear: () => {
    return queryClient.clear();
  },
};

export default queryClient;
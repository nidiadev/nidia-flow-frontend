# HTTP Client and Error Handling System

This document describes the enhanced HTTP client and error handling system implemented for the NIDIA Flow frontend.

## Overview

The system provides:
- Enhanced Axios configuration with automatic token management
- TanStack Query integration for caching and synchronization
- Comprehensive error handling with user-friendly messages
- Automatic retry logic for failed requests
- Loading states and Suspense integration
- Network status awareness
- Type-safe API client

## Components

### 1. Enhanced API Client (`api.ts`)

The API client is built on Axios with the following features:

#### Features:
- **Automatic Authentication**: JWT tokens are automatically added to requests
- **Token Refresh**: Automatic token refresh on 401 errors
- **Request/Response Logging**: Detailed logging in development mode
- **Retry Logic**: Exponential backoff for network and server errors
- **Error Handling**: User-friendly error messages with toast notifications
- **Request Tracking**: Unique request IDs for debugging

#### Usage:
```typescript
import { ApiClient } from '@/lib/api';

// Type-safe API calls
const response = await ApiClient.get<Customer[]>('/customers');
const customer = await ApiClient.post<Customer>('/customers', customerData);
```

#### Configuration:
```typescript
// Custom retry configuration
const apiWithRetry = createRequestWithRetry({
  retries: 5,
  retryDelay: 2000,
  retryCondition: (error) => error.response?.status >= 500
});
```

### 2. TanStack Query Configuration (`query-client.ts`)

Enhanced query client with smart caching and error handling:

#### Features:
- **Smart Retry Logic**: Different retry strategies for queries vs mutations
- **Exponential Backoff**: With jitter to prevent thundering herd
- **Global Error Handling**: Automatic error notifications
- **Query Key Factory**: Consistent key generation
- **Cache Utilities**: Helper functions for cache management

#### Query Keys:
```typescript
import { queryKeys } from '@/lib/query-client';

// Consistent query keys
const customerQuery = useQuery({
  queryKey: queryKeys.crm.customer(customerId),
  queryFn: () => ApiClient.get(`/customers/${customerId}`)
});
```

#### Cache Management:
```typescript
import { cacheUtils } from '@/lib/query-client';

// Invalidate all CRM data
await cacheUtils.invalidateEntity('crm');

// Prefetch data
await cacheUtils.prefetch(
  queryKeys.products.list(),
  () => ApiClient.get('/products')
);
```

### 3. API Hooks (`use-api.ts`)

Type-safe React hooks for API operations:

#### Features:
- **Generic Hooks**: `useApiQuery` and `useApiMutation` for any endpoint
- **Specific Hooks**: Pre-configured hooks for common operations
- **Optimistic Updates**: Built-in support for optimistic UI updates
- **Cache Integration**: Automatic cache invalidation on mutations

#### Examples:
```typescript
// Generic usage
const { data, isLoading, error } = useApiQuery(
  ['customers', filters],
  () => ApiClient.get('/customers', { params: filters })
);

// Specific hooks
const { data: customers } = useCustomers({ status: 'active' });
const createCustomer = useCreateCustomer();

// Mutations with automatic cache updates
const handleCreate = async (customerData) => {
  await createCustomer.mutateAsync(customerData);
  // Cache is automatically invalidated
};
```

### 4. Loading Components (`loading.tsx`)

Comprehensive loading states and error boundaries:

#### Components:
- **LoadingSpinner**: Configurable spinner component
- **PageLoading**: Full page loading state
- **CardSkeleton**: Skeleton loading for cards
- **TableSkeleton**: Skeleton loading for tables
- **LoadingButton**: Button with loading state
- **ErrorFallback**: Error boundary fallback
- **QueryLoading**: TanStack Query loading wrapper

#### Usage:
```typescript
// Query loading wrapper
<QueryLoading
  isLoading={isLoading}
  isError={isError}
  error={error}
  isEmpty={!data || data.length === 0}
  onRetry={refetch}
>
  {/* Your content */}
</QueryLoading>

// Loading button
<LoadingButton loading={mutation.isPending} onClick={handleSubmit}>
  Save Changes
</LoadingButton>
```

### 5. Error Boundary (`error-boundary.tsx`)

React error boundaries for graceful error handling:

#### Features:
- **Automatic Error Catching**: Catches JavaScript errors in component tree
- **Custom Fallbacks**: Configurable error UI
- **Error Reporting**: Integration ready for Sentry
- **Recovery**: Reset error state functionality

#### Usage:
```typescript
// Wrap components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// HOC pattern
const SafeComponent = withErrorBoundary(YourComponent);

// Hook for manual error throwing
const { captureError } = useErrorBoundary();
```

### 6. Network Status (`use-network-status.ts`)

Network awareness for offline functionality:

#### Features:
- **Online/Offline Detection**: Real-time network status
- **Automatic Refetch**: Refetch queries when coming back online
- **User Notifications**: Toast messages for network changes
- **Retry Logic**: Network-aware retry strategies

#### Usage:
```typescript
const { isOnline, isOffline, wasOffline } = useNetworkStatus();

// Conditional rendering
{isOffline && (
  <div className="offline-banner">
    Working offline - some features may be limited
  </div>
)}
```

## Best Practices

### 1. Error Handling
- Always use `QueryLoading` wrapper for data fetching components
- Provide meaningful error messages and recovery actions
- Use error boundaries to catch unexpected errors
- Log errors appropriately (console in dev, service in prod)

### 2. Loading States
- Show skeleton loaders for better perceived performance
- Use `LoadingButton` for form submissions
- Implement progressive loading for large datasets
- Provide empty states for no data scenarios

### 3. Caching Strategy
- Use appropriate `staleTime` based on data freshness requirements
- Implement optimistic updates for better UX
- Invalidate related cache entries on mutations
- Prefetch data for anticipated user actions

### 4. Network Resilience
- Handle offline scenarios gracefully
- Implement retry logic for transient failures
- Show network status to users when relevant
- Queue operations for when connectivity returns

### 5. Performance
- Use `keepPreviousData` for paginated queries
- Implement proper query key structures
- Debounce search inputs
- Use React.memo for expensive components

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:4001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:4001
NODE_ENV=development
```

### Query Client Options
```typescript
// Customize in query-client.ts
const queryConfig = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry: 3,
    refetchOnWindowFocus: true,
  },
  mutations: {
    retry: 1,
  },
};
```

### API Client Options
```typescript
// Customize in api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Monitoring and Debugging

### Development Tools
- React Query DevTools (enabled in development)
- Console logging for requests/responses
- Error details in development mode
- Network status indicators

### Production Monitoring
- Error tracking integration (Sentry ready)
- Performance metrics
- User-friendly error messages
- Graceful degradation

## Migration Guide

### From Basic Axios
```typescript
// Before
const response = await axios.get('/customers');
const customers = response.data;

// After
const { data: customers, isLoading, error } = useCustomers();
```

### Adding Loading States
```typescript
// Before
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);

// After
const { data, isLoading } = useApiQuery(
  queryKey,
  queryFn
);
```

### Error Handling
```typescript
// Before
try {
  const response = await api.get('/data');
  setData(response.data);
} catch (error) {
  setError(error.message);
}

// After
const { data, error } = useApiQuery(queryKey, queryFn);
// Error handling is automatic
```

This system provides a robust foundation for HTTP communication with excellent user experience, error resilience, and developer productivity.
'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize with current status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      
      if (wasOffline) {
        toast.success('Conexión restaurada. Sincronizando datos...');
        
        // Refetch all queries when coming back online
        queryClient.refetchQueries({
          type: 'active',
          stale: true,
        });
        
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.error('Sin conexión a internet. Trabajando en modo offline.');
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient, wasOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
  };
}

// Hook to check if a request should be retried based on network status
export function useNetworkAwareRetry() {
  const { isOnline } = useNetworkStatus();

  return (failureCount: number, error: any) => {
    // Don't retry if offline
    if (!isOnline) {
      return false;
    }

    // Don't retry on client errors (4xx)
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false;
    }

    // Retry on network errors and server errors
    return failureCount < 3;
  };
}
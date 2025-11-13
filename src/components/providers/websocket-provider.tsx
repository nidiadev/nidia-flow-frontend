'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'sonner';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { isConnected } = useWebSocket({
    autoConnect: true,
    onConnect: () => {
      console.log('WebSocket connected successfully');
    },
    onDisconnect: (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        toast.error('Conexión perdida con el servidor');
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onReconnect: (attempts) => {
      console.log('WebSocket reconnected after', attempts, 'attempts');
      toast.success('Conexión restablecida');
    },
  });

  useEffect(() => {
    // Show connection status in development
    if (process.env.NODE_ENV === 'development') {
      console.log('WebSocket status:', isConnected ? 'Connected' : 'Disconnected');
    }
  }, [isConnected]);

  return <>{children}</>;
}

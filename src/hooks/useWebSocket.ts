import { useEffect, useState, useCallback } from 'react';
import { wsService } from '@/lib/websocket';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: any) => void;
  onReconnect?: (attempts: number) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
    onReconnect,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>();

  useEffect(() => {
    // Get token from localStorage or your auth system
    const token = localStorage.getItem('accessToken');

    if (autoConnect && token) {
      wsService.connect(token);
    }

    // Connection handlers
    const handleConnect = (data: any) => {
      setIsConnected(true);
      setSocketId(data.socketId);
      onConnect?.();
    };

    const handleDisconnect = (data: any) => {
      setIsConnected(false);
      setSocketId(undefined);
      onDisconnect?.(data.reason);
    };

    const handleError = (data: any) => {
      onError?.(data.error);
    };

    const handleReconnect = (data: any) => {
      setIsConnected(true);
      onReconnect?.(data.attempts);
    };

    wsService.on('connection:success', handleConnect);
    wsService.on('connection:disconnected', handleDisconnect);
    wsService.on('connection:error', handleError);
    wsService.on('connection:reconnected', handleReconnect);

    return () => {
      wsService.off('connection:success', handleConnect);
      wsService.off('connection:disconnected', handleDisconnect);
      wsService.off('connection:error', handleError);
      wsService.off('connection:reconnected', handleReconnect);
    };
  }, [autoConnect, onConnect, onDisconnect, onError, onReconnect]);

  const subscribe = useCallback((event: string, callback: Function) => {
    wsService.on(event, callback);
    return () => wsService.off(event, callback);
  }, []);

  const send = useCallback((event: string, data?: any) => {
    wsService.send(event, data);
  }, []);

  const disconnect = useCallback(() => {
    wsService.disconnect();
  }, []);

  return {
    isConnected,
    socketId,
    subscribe,
    send,
    disconnect,
  };
}

// Specific hooks for common use cases
export function useOrderEvents(
  onOrderCreated?: (order: any) => void,
  onOrderUpdated?: (order: any) => void,
  onOrderAssigned?: (order: any) => void
) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (onOrderCreated) {
      unsubscribers.push(subscribe('order:created', onOrderCreated));
    }
    if (onOrderUpdated) {
      unsubscribers.push(subscribe('order:updated', onOrderUpdated));
    }
    if (onOrderAssigned) {
      unsubscribers.push(subscribe('order:assigned', onOrderAssigned));
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, onOrderCreated, onOrderUpdated, onOrderAssigned]);
}

export function useTaskEvents(
  onTaskCreated?: (task: any) => void,
  onTaskUpdated?: (task: any) => void,
  onTaskAssigned?: (task: any) => void,
  onTaskStarted?: (task: any) => void,
  onTaskCompleted?: (task: any) => void,
  onTaskLocationUpdated?: (task: any) => void
) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (onTaskCreated) {
      unsubscribers.push(subscribe('task:created', onTaskCreated));
    }
    if (onTaskUpdated) {
      unsubscribers.push(subscribe('task:updated', onTaskUpdated));
    }
    if (onTaskAssigned) {
      unsubscribers.push(subscribe('task:assigned', onTaskAssigned));
    }
    if (onTaskStarted) {
      unsubscribers.push(subscribe('task:started', onTaskStarted));
    }
    if (onTaskCompleted) {
      unsubscribers.push(subscribe('task:completed', onTaskCompleted));
    }
    if (onTaskLocationUpdated) {
      unsubscribers.push(subscribe('task:location-updated', onTaskLocationUpdated));
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [
    subscribe,
    onTaskCreated,
    onTaskUpdated,
    onTaskAssigned,
    onTaskStarted,
    onTaskCompleted,
    onTaskLocationUpdated,
  ]);
}

export function useNotificationEvents(onNotification?: (notification: any) => void) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (!onNotification) return;

    const unsubscribe = subscribe('notification:new', onNotification);
    return () => unsubscribe();
  }, [subscribe, onNotification]);
}

export function useUserPresence(
  onUserOnline?: (user: any) => void,
  onUserOffline?: (user: any) => void
) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (onUserOnline) {
      unsubscribers.push(subscribe('user:online', onUserOnline));
    }
    if (onUserOffline) {
      unsubscribers.push(subscribe('user:offline', onUserOffline));
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, onUserOnline, onUserOffline]);
}

export function useMetricsUpdates(onMetricsUpdated?: (metrics: any) => void) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (!onMetricsUpdated) return;

    const unsubscribe = subscribe('metrics:updated', onMetricsUpdated);
    return () => unsubscribe();
  }, [subscribe, onMetricsUpdated]);
}

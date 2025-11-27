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

export function useCustomerEvents(
  onCustomerCreated?: (customer: any) => void,
  onCustomerUpdated?: (customer: any) => void,
  onCustomerStatusChanged?: (customer: any) => void
) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (onCustomerCreated) {
      unsubscribers.push(subscribe('customer:created', onCustomerCreated));
    }
    if (onCustomerUpdated) {
      unsubscribers.push(subscribe('customer:updated', onCustomerUpdated));
    }
    if (onCustomerStatusChanged) {
      unsubscribers.push(subscribe('customer:status-changed', onCustomerStatusChanged));
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, onCustomerCreated, onCustomerUpdated, onCustomerStatusChanged]);
}

export function useInteractionEvents(
  onInteractionCreated?: (interaction: any) => void,
  onInteractionUpdated?: (interaction: any) => void,
  onInteractionStatusChanged?: (interaction: any) => void
) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (onInteractionCreated) {
      unsubscribers.push(subscribe('interaction:created', onInteractionCreated));
    }
    if (onInteractionUpdated) {
      unsubscribers.push(subscribe('interaction:updated', onInteractionUpdated));
    }
    if (onInteractionStatusChanged) {
      unsubscribers.push(subscribe('interaction:status-changed', onInteractionStatusChanged));
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, onInteractionCreated, onInteractionUpdated, onInteractionStatusChanged]);
}

export function useCustomerNoteEvents(
  onNoteCreated?: (note: any) => void,
  onNoteUpdated?: (note: any) => void,
  onNoteDeleted?: (note: any) => void
) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (onNoteCreated) {
      unsubscribers.push(subscribe('customer:note:created', onNoteCreated));
    }
    if (onNoteUpdated) {
      unsubscribers.push(subscribe('customer:note:updated', onNoteUpdated));
    }
    if (onNoteDeleted) {
      unsubscribers.push(subscribe('customer:note:deleted', onNoteDeleted));
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, onNoteCreated, onNoteUpdated, onNoteDeleted]);
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

// Deal events hook
export function useDealEvents(
  onDealCreated?: (deal: any) => void,
  onDealUpdated?: (deal: any) => void,
  onDealStageChanged?: (deal: any) => void,
  onDealWon?: (deal: any) => void,
  onDealLost?: (deal: any) => void
) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (onDealCreated) {
      unsubscribers.push(subscribe('deal:created', onDealCreated));
    }
    if (onDealUpdated) {
      unsubscribers.push(subscribe('deal:updated', onDealUpdated));
    }
    if (onDealStageChanged) {
      unsubscribers.push(subscribe('deal:stage:changed', onDealStageChanged));
    }
    if (onDealWon) {
      unsubscribers.push(subscribe('deal:won', onDealWon));
    }
    if (onDealLost) {
      unsubscribers.push(subscribe('deal:lost', onDealLost));
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, onDealCreated, onDealUpdated, onDealStageChanged, onDealWon, onDealLost]);
}

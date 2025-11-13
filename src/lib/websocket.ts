import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

    this.socket = io(wsUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit('connection:success', { socketId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('connection:disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.emit('connection:error', { error, attempts: this.reconnectAttempts });

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('connection:failed', { attempts: this.reconnectAttempts });
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.emit('connection:reconnected', { attempts: attemptNumber });
    });

    // Business events
    this.socket.on('order:created', (data) => this.emit('order:created', data));
    this.socket.on('order:updated', (data) => this.emit('order:updated', data));
    this.socket.on('order:assigned', (data) => this.emit('order:assigned', data));

    this.socket.on('task:created', (data) => this.emit('task:created', data));
    this.socket.on('task:updated', (data) => this.emit('task:updated', data));
    this.socket.on('task:assigned', (data) => this.emit('task:assigned', data));
    this.socket.on('task:started', (data) => this.emit('task:started', data));
    this.socket.on('task:completed', (data) => this.emit('task:completed', data));
    this.socket.on('task:location-updated', (data) =>
      this.emit('task:location-updated', data)
    );

    this.socket.on('notification:new', (data) =>
      this.emit('notification:new', data)
    );

    this.socket.on('user:online', (data) => this.emit('user:online', data));
    this.socket.on('user:offline', (data) => this.emit('user:offline', data));

    this.socket.on('metrics:updated', (data) =>
      this.emit('metrics:updated', data)
    );
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('WebSocket disconnected manually');
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(callback);
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  send(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected. Cannot send event:', event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const wsService = new WebSocketService();

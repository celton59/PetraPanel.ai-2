import { create } from 'zustand';
import { formatNotificationDate } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import { useEffect, useRef } from 'react';

// Tipos
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: Date;
  read: boolean;
  readLater: boolean;
  actionUrl?: string;
  actionLabel?: string;
  image?: string;
  sender?: {
    id: number;
    name: string;
    avatar?: string;
  };
}

// Configuración
const NOTIFICATION_CONFIG = {
  API: {
    BASE_URL: '/api/notifications',
    WS_URL: '/api/ws/notifications',
  },
  RETRY: {
    MAX_RETRIES: 10,
    BASE_RETRY_MS: 2000,
    MAX_DELAY_MS: 30000,
    POLL_INTERVAL_MS: 60000,
  },
  WEBSOCKET: {
    HEARTBEAT_INTERVAL_MS: 25000,
  },
  CACHE_TIME: {
    SHORT: 1 * 60 * 1000, // 1 minuto
    MEDIUM: 5 * 60 * 1000, // 5 minutos
    LONG: 30 * 60 * 1000   // 30 minutos
  },
  DEDUP_WINDOW_MS: 5000, // Ventana de deduplicación de 5 segundos
}

// Store de Zustand para manejo de notificaciones en memoria
interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  readLaterCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'readLater'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  toggleReadLater: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

// Cliente API para notificaciones
const notificationApiClient = {
  async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Error en la petición: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : data;
  },

  async fetchNotifications(includeRead = false): Promise<any[]> {
    return this.fetchJson<any[]>(`${NOTIFICATION_CONFIG.API.BASE_URL}?includeRead=${includeRead}`);
  },

  async markAsRead(id: string | number): Promise<boolean> {
    if (typeof id === 'string' && id.length > 10) {
      console.log('ID parece ser un timestamp de frontend, marcando como leído localmente');
      return true;
    }

    return this.fetchJson<boolean>(`${NOTIFICATION_CONFIG.API.BASE_URL}/${id}/read`, {
      method: 'POST',
    });
  },

  async markAllAsRead(): Promise<boolean> {
    return this.fetchJson<boolean>(`${NOTIFICATION_CONFIG.API.BASE_URL}/read-all`, {
      method: 'POST',
    });
  },

  async archiveNotification(id: string | number): Promise<boolean> {
    if (typeof id === 'string' && id.length > 10) {
      console.log('ID parece ser un timestamp de frontend, marcando como archivado localmente');
      return true;
    }

    return this.fetchJson<boolean>(`${NOTIFICATION_CONFIG.API.BASE_URL}/${id}/archive`, {
      method: 'POST',
    });
  },

  async createNotification(data: {
    title: string;
    message: string;
    type: NotificationType;
    actionUrl?: string;
    actionLabel?: string;
    targetUsers?: number[];
  }): Promise<any> {
    return this.fetchJson<any>(NOTIFICATION_CONFIG.API.BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }
};

// Store de Zustand para el estado de las notificaciones
export const useNotifications = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  readLaterCount: 0,

  addNotification: (notification) => {
    set((state) => {
      // Generar un ID único basado en el título y el mensaje para evitar duplicados
      const contentHash = `${notification.title}-${notification.message}`.replace(/\s+/g, '');
      const id = `${Date.now()}-${contentHash}`;
      
      // Verificar si ya existe una notificación similar en la ventana de deduplicación
      const now = new Date();
      const recentNotifications = state.notifications.filter(n => {
        const timeDiff = now.getTime() - n.createdAt.getTime();
        return timeDiff < NOTIFICATION_CONFIG.DEDUP_WINDOW_MS && 
               n.title === notification.title && 
               n.message === notification.message;
      });
      
      // Si ya existe una notificación similar reciente, no añadir una nueva
      if (recentNotifications.length > 0) {
        console.log('Notificación similar encontrada, ignorando duplicado');
        return state;
      }
      
      const newNotification: Notification = {
        ...notification,
        id,
        createdAt: new Date(),
        read: false,
        readLater: false,
      };

      const notifications = [newNotification, ...state.notifications].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      return { 
        notifications, 
        unreadCount: notifications.filter((n) => !n.read).length,
        readLaterCount: notifications.filter((n) => n.readLater).length,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const notifications = state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      );

      return { 
        notifications, 
        unreadCount: notifications.filter((n) => !n.read).length,
        readLaterCount: notifications.filter((n) => n.readLater).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const notifications = state.notifications.map((notification) => ({
        ...notification,
        read: true,
      }));

      return { 
        notifications, 
        unreadCount: 0, 
        readLaterCount: notifications.filter((n) => n.readLater).length,
      };
    });
  },

  toggleReadLater: (id) => {
    set((state) => {
      const notifications = state.notifications.map((notification) =>
        notification.id === id
          ? { ...notification, readLater: !notification.readLater }
          : notification
      );

      return { 
        notifications, 
        unreadCount: notifications.filter((n) => !n.read).length,
        readLaterCount: notifications.filter((n) => n.readLater).length,
      };
    });
  },

  removeNotification: (id) => {
    set((state) => {
      const notifications = state.notifications.filter(
        (notification) => notification.id !== id
      );

      return { 
        notifications, 
        unreadCount: notifications.filter((n) => !n.read).length,
        readLaterCount: notifications.filter((n) => n.readLater).length,
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0, readLaterCount: 0 });
  },
}));

// WebSocketManager - Clase para manejo de conexiones WebSocket
class WebSocketManager {
  private ws: WebSocket | null = null;
  private userId: number;
  private retryCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionalClose = false;
  private messageHandler: (data: any) => void;
  private errorHandler: (error: any) => void;

  constructor(
    userId: number, 
    messageHandler: (data: any) => void,
    errorHandler: (error: any) => void
  ) {
    this.userId = userId;
    this.messageHandler = messageHandler;
    this.errorHandler = errorHandler;
  }

  private clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private setupHeartbeat() {
    this.clearTimers();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping_client' }));
        } catch (e) {
          console.log('Error al enviar heartbeat manual, reconectando...');
          this.clearTimers();
          this.closeConnection();
          this.createConnection();
        }
      }
    }, NOTIFICATION_CONFIG.WEBSOCKET.HEARTBEAT_INTERVAL_MS);
  }

  private closeConnection() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // Ignorar errores al cerrar
      }
      this.ws = null;
    }
  }

  createConnection() {
    this.clearTimers();
    this.closeConnection();
    this.isIntentionalClose = false;
    
    console.log('Conectando WebSocket de notificaciones...');
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}${NOTIFICATION_CONFIG.API.WS_URL}?userId=${this.userId}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('Conexión WebSocket de notificaciones establecida');
      this.retryCount = 0;
      this.setupHeartbeat();
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandler(data);
      } catch (error) {
        console.error('Error al procesar mensaje WebSocket:', error);
        this.errorHandler(error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('Error en WebSocket de notificaciones:', error);
      this.errorHandler(error);
    };
    
    this.ws.onclose = (event) => {
      this.clearTimers();
      console.log('Conexión WebSocket de notificaciones cerrada');
      
      if (!this.isIntentionalClose) {
        this.retryCount++;
        
        // Tiempo de espera exponencial con jitter
        const delay = Math.min(
          NOTIFICATION_CONFIG.RETRY.BASE_RETRY_MS * Math.pow(1.5, this.retryCount) + Math.random() * 1000,
          NOTIFICATION_CONFIG.RETRY.MAX_DELAY_MS
        );
        
        if (this.retryCount <= NOTIFICATION_CONFIG.RETRY.MAX_RETRIES) {
          console.log(`Reconectando en ${Math.round(delay)}ms...`);
          this.reconnectTimer = setTimeout(() => this.createConnection(), delay);
        } else {
          console.log('Demasiados intentos fallidos, usando REST como fallback');
          
          this.reconnectTimer = setTimeout(() => {
            this.retryCount = 0;
            this.createConnection();
          }, NOTIFICATION_CONFIG.RETRY.POLL_INTERVAL_MS);
          
          // Notificar para activar fallback
          this.errorHandler(new Error('Max retries exceeded, using REST fallback'));
        }
      }
    };
    
    return this.ws;
  }

  close() {
    this.isIntentionalClose = true;
    this.clearTimers();
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, 'Cierre intencional');
    }
  }

  reconnect() {
    this.retryCount = 0;
    this.closeConnection();
    this.createConnection();
  }

  getState() {
    return {
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      retryCount: this.retryCount,
      isIntentionalClose: this.isIntentionalClose
    };
  }
}

// Hook mejorado para conectarse al WebSocket y recibir notificaciones
export function useNotificationWebSocket() {
  const { addNotification } = useNotifications();
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  
  const connect = (userId: number) => {
    if (wsManagerRef.current) {
      return wsManagerRef.current;
    }
    
    const handleMessage = (data: any) => {
      switch (data.type) {
        case 'new_notification':
          addNotification({
            title: data.data.title,
            message: data.data.message,
            type: data.data.type as NotificationType,
            actionUrl: data.data.actionUrl,
            actionLabel: data.data.actionLabel,
            sender: data.data.sender ? {
              id: data.data.sender.id,
              name: data.data.sender.fullName || data.data.sender.username,
              avatar: data.data.sender.avatarUrl
            } : undefined
          });
          break;
          
        case 'unread_notifications':
          data.data.forEach((notification: any) => {
            addNotification({
              title: notification.title,
              message: notification.message,
              type: notification.type as NotificationType,
              actionUrl: notification.actionUrl,
              actionLabel: notification.actionLabel,
              sender: notification.sender ? {
                id: notification.sender.id,
                name: notification.sender.fullName || notification.sender.username,
                avatar: notification.sender.avatarUrl
              } : undefined
            });
          });
          break;
          
        case 'ping':
          if (wsManagerRef.current?.getState().isConnected) {
            wsManagerRef.current.createConnection().send(JSON.stringify({ type: 'pong' }));
          }
          break;
      }
    };
    
    const handleError = async (error: any) => {
      if (error.message?.includes('using REST fallback')) {
        try {
          const notifications = await notificationApiClient.fetchNotifications();
          notifications.forEach((notification: any) => {
            addNotification({
              title: notification.title,
              message: notification.message,
              type: notification.type as NotificationType,
              actionUrl: notification.actionUrl,
              actionLabel: notification.actionLabel,
              sender: notification.sender
            });
          });
        } catch (restError) {
          console.error('Error al obtener notificaciones por REST:', restError);
        }
      }
    };
    
    const wsManager = new WebSocketManager(userId, handleMessage, handleError);
    wsManagerRef.current = wsManager;
    wsManager.createConnection();
    
    return {
      close: () => {
        wsManager.close();
        wsManagerRef.current = null;
      },
      reconnect: () => {
        wsManager.reconnect();
      },
      getState: () => wsManager.getState()
    };
  };
  
  return { connect };
}

// Hook para obtener y gestionar notificaciones mediante React Query
export function useNotificationAPI() {
  const queryClient = useQueryClient();
  const NOTIFICATIONS_QUERY_KEY = ['notifications'];
  const { addNotification, markAsRead: markAsReadLocal, markAllAsRead: markAllAsReadLocal } = useNotifications();
  
  // Consulta para obtener notificaciones
  const { data: notifications, isLoading, error, refetch } = useQuery<any[]>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => notificationApiClient.fetchNotifications(false),
    staleTime: NOTIFICATION_CONFIG.CACHE_TIME.SHORT,
    retry: 2,
    refetchOnWindowFocus: true
  });
    
  // Efecto para sincronizar notificaciones con el estado local cuando llegan nuevos datos
  useEffect(() => {
    if (notifications) {
      notifications.forEach((notification) => {
        addNotification({
          title: notification.title,
          message: notification.message,
          type: notification.type as NotificationType,
          actionUrl: notification.actionUrl,
          actionLabel: notification.actionLabel,
          sender: notification.sender
        });
      });
    }
  }, [notifications, addNotification]);
  
  // Mutación para marcar como leída
  const markAsReadMutation = useMutation({
    mutationFn: (id: string | number) => notificationApiClient.markAsRead(id),
    onSuccess: (_, id) => {
      // Actualizar el estado local
      if (typeof id === 'string') {
        markAsReadLocal(id);
      }
      
      // Invalidar consultas
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Error al marcar notificación como leída:', error);
      toast.error('No se pudo marcar la notificación como leída');
    }
  });
  
  // Mutación para marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApiClient.markAllAsRead(),
    onSuccess: () => {
      // Actualizar el estado local
      markAllAsReadLocal();
      
      // Invalidar consultas
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      
      toast.success('Todas las notificaciones marcadas como leídas');
    },
    onError: (error) => {
      console.error('Error al marcar todas como leídas:', error);
      toast.error('No se pudieron marcar todas las notificaciones como leídas');
    }
  });
  
  // Mutación para archivar notificación
  const archiveNotificationMutation = useMutation({
    mutationFn: (id: string | number) => notificationApiClient.archiveNotification(id),
    onSuccess: () => {
      // Invalidar consultas
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      
      toast.success('Notificación archivada');
    },
    onError: (error) => {
      console.error('Error al archivar notificación:', error);
      toast.error('No se pudo archivar la notificación');
    }
  });
  
  // Mutación para crear notificación
  const createNotificationMutation = useMutation({
    mutationFn: (data: {
      title: string;
      message: string;
      type: NotificationType;
      actionUrl?: string;
      actionLabel?: string;
      targetUsers?: number[];
    }) => notificationApiClient.createNotification(data),
    onSuccess: () => {
      // Invalidar consultas
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Error al crear notificación:', error);
      toast.error('No se pudo crear la notificación');
    }
  });
  
  // Función mejorada para obtener notificaciones
  const fetchNotifications = async (includeRead = false) => {
    try {
      const result = await queryClient.fetchQuery({
        queryKey: [...NOTIFICATIONS_QUERY_KEY, { includeRead }],
        queryFn: () => notificationApiClient.fetchNotifications(includeRead),
        staleTime: NOTIFICATION_CONFIG.CACHE_TIME.SHORT
      });
      return result;
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      throw error;
    }
  };
  
  return {
    notifications,
    isLoading,
    error,
    refetch,
    fetchNotifications,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    archiveNotification: archiveNotificationMutation.mutateAsync,
    createNotification: createNotificationMutation.mutateAsync
  };
}
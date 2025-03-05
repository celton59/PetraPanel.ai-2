import { create } from 'zustand';
import { formatNotificationDate } from '@/lib/utils';

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

export const useNotifications = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  readLaterCount: 0,

  addNotification: (notification) => {
    set((state) => {
      // Generar un ID único basado en el título y el mensaje para evitar duplicados
      const contentHash = `${notification.title}-${notification.message}`.replace(/\s+/g, '');
      const id = `${Date.now()}-${contentHash}`;
      
      // Verificar si ya existe una notificación similar en los últimos 5 segundos
      const now = new Date();
      const recentNotifications = state.notifications.filter(n => {
        const timeDiff = now.getTime() - n.createdAt.getTime();
        return timeDiff < 5000 && 
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

// Hook para conectarse al WebSocket y recibir notificaciones
export function useNotificationWebSocket() {
  const { addNotification } = useNotifications();
  
  const connect = (userId: number) => {
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws/notifications?userId=${userId}`);
    
    ws.onopen = () => {
      console.log('Conexión WebSocket de notificaciones establecida');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'new_notification':
            // Convertir notificación del servidor al formato de la tienda
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
            // Procesar notificaciones no leídas al conectar
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
            // Responder al ping del servidor para mantener la conexión
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (error) {
        console.error('Error al procesar mensaje WebSocket:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Error en WebSocket de notificaciones:', error);
    };
    
    ws.onclose = () => {
      console.log('Conexión WebSocket de notificaciones cerrada');
      
      // Reintentar conexión después de un retraso
      setTimeout(() => {
        console.log('Reconectando WebSocket de notificaciones...');
        connect(userId);
      }, 5000);
    };
    
    return ws;
  };
  
  return { connect };
}

// Hook para obtener notificaciones desde la API
export function useNotificationAPI() {
  const fetchNotifications = async (includeRead = false) => {
    try {
      const response = await fetch(`/api/notifications?includeRead=${includeRead}`);
      if (!response.ok) throw new Error('Error al obtener notificaciones');
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      return [];
    }
  };
  
  const markAsRead = async (id: string | number) => {
    try {
      // Si el ID parece ser un timestamp, no intentamos enviarlo al servidor
      if (typeof id === 'string' && id.length > 10) {
        console.log('ID parece ser un timestamp de frontend, marcando como leído localmente');
        return true;
      }
      
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      return false;
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      return false;
    }
  };
  
  const archiveNotification = async (id: string | number) => {
    try {
      // Si el ID parece ser un timestamp, no intentamos enviarlo al servidor
      if (typeof id === 'string' && id.length > 10) {
        console.log('ID parece ser un timestamp de frontend, marcando como archivado localmente');
        return true;
      }
      
      const response = await fetch(`/api/notifications/${id}/archive`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error al archivar notificación:', error);
      return false;
    }
  };
  
  return {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification
  };
}
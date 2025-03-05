import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

// Generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useNotifications = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      readLaterCount: 0,
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: generateId(),
          createdAt: new Date(),
          read: false,
          readLater: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }));
        
        // Auto remove system notifications after 5 seconds
        if (notification.type === 'system') {
          setTimeout(() => {
            get().markAsRead(newNotification.id);
          }, 5000);
        }
      },
      
      markAsRead: (id) => {
        set((state) => {
          const notifications = state.notifications.map(notification => 
            notification.id === id ? { ...notification, read: true } : notification
          );
          
          // Count unread
          const unreadCount = notifications.filter(n => !n.read).length;
          
          return { notifications, unreadCount };
        });
      },
      
      markAllAsRead: () => {
        set((state) => {
          const notifications = state.notifications.map(notification => ({
            ...notification,
            read: true
          }));
          
          return { 
            notifications, 
            unreadCount: 0 
          };
        });
      },
      
      toggleReadLater: (id) => {
        set((state) => {
          const notifications = state.notifications.map(notification => 
            notification.id === id 
              ? { ...notification, readLater: !notification.readLater } 
              : notification
          );
          
          // Count read later
          const readLaterCount = notifications.filter(n => n.readLater).length;
          
          return { notifications, readLaterCount };
        });
      },
      
      removeNotification: (id) => {
        set((state) => {
          const filteredNotifications = state.notifications.filter(
            notification => notification.id !== id
          );
          
          // Recalculate counts
          const unreadCount = filteredNotifications.filter(n => !n.read).length;
          const readLaterCount = filteredNotifications.filter(n => n.readLater).length;
          
          return { 
            notifications: filteredNotifications,
            unreadCount,
            readLaterCount
          };
        });
      },
      
      clearAll: () => {
        set({ notifications: [], unreadCount: 0, readLaterCount: 0 });
      }
    }),
    {
      name: 'notifications-storage',
    }
  )
);

// Demo notifications for development
if (process.env.NODE_ENV === 'development') {
  // Only add demo notifications if there are none
  setTimeout(() => {
    const { notifications, addNotification } = useNotifications.getState();
    
    if (notifications.length === 0) {
      addNotification({
        title: 'Nuevo video asignado',
        message: 'Se te ha asignado un nuevo video para optimizar: "Cómo hacer un blog con NextJS"',
        type: 'info',
        actionUrl: '/videos',
        actionLabel: 'Ver video',
        sender: {
          id: 1,
          name: 'Sistema',
          avatar: '/logo.svg'
        }
      });
      
      addNotification({
        title: 'Nueva actualización disponible',
        message: 'Hay una nueva actualización del sistema disponible. Actualiza para obtener las últimas funciones.',
        type: 'system',
        actionLabel: 'Actualizar ahora',
      });
      
      addNotification({
        title: 'Comentario en tu video',
        message: 'María ha comentado en tu video "Tutorial de React": "Excelente explicación, muy claro todo!"',
        type: 'info',
        sender: {
          id: 3,
          name: 'María López',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria'
        }
      });
    }
  }, 1000);
}
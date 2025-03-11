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
    // Control de reintentos y estado
    let retryCount = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
    const MAX_RETRIES = 10; // Aumentamos el número máximo de reintentos
    const BASE_RETRY_MS = 2000;
    const HEARTBEAT_INTERVAL = 25000; // 25 segundos, menor que el intervalo del servidor (30s)
    let ws: WebSocket | null = null;
    let isIntentionalClose = false;
    
    // Función para limpiar temporizadores
    const clearTimers = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
        heartbeatTimer = null;
      }
    };
    
    // Función para configurar heartbeat manual
    const setupHeartbeat = () => {
      clearTimers(); // Limpiar temporizadores existentes
      
      // Configurar nuevo heartbeat
      heartbeatTimer = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            // Enviar ping manual para mantener la conexión activa
            ws.send(JSON.stringify({ type: 'ping_client' }));
          } catch (e) {
            console.log('Error al enviar heartbeat manual, reconectando...');
            clearTimers();
            if (ws) {
              try {
                ws.close();
              } catch (err) {
                // Ignorar errores al cerrar
              }
            }
            createConnection();
          }
        }
      }, HEARTBEAT_INTERVAL);
    };
    
    // Función para crear la conexión WebSocket
    const createConnection = () => {
      // Limpiar temporizadores previos
      clearTimers();
      
      // Cerrar conexión previa si existe
      if (ws) {
        try {
          ws.close();
        } catch (e) {
          // Ignorar errores al cerrar
        }
      }
      
      // Resetear flag de cierre intencional
      isIntentionalClose = false;
      
      // Crear nueva conexión
      console.log('Reconectando WebSocket de notificaciones...');
      ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws/notifications?userId=${userId}`);
      
      ws.onopen = () => {
        console.log('Conexión WebSocket de notificaciones establecida');
        
        // Reiniciar contador de reintentos al conectar exitosamente
        retryCount = 0;
        
        // Configurar heartbeat
        setupHeartbeat();
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
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'pong' }));
              }
              break;
          }
        } catch (error) {
          console.error('Error al procesar mensaje WebSocket:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('Error en WebSocket de notificaciones:', error);
      };
      
      ws.onclose = (event) => {
        // Limpiar heartbeat
        clearTimers();
        
        console.log('Conexión WebSocket de notificaciones cerrada');
        
        // Solo intentar reconectar si la conexión no fue cerrada intencionalmente
        if (!isIntentionalClose) {
          retryCount++;
          
          // Tiempo de espera exponencial con jitter
          const delay = Math.min(
            BASE_RETRY_MS * Math.pow(1.5, retryCount) + Math.random() * 1000,
            30000 // Máximo 30 segundos
          );
          
          if (retryCount <= MAX_RETRIES) {
            console.log(`Reconectando en ${Math.round(delay)}ms...`);
            reconnectTimer = setTimeout(createConnection, delay);
          } else {
            console.log('Demasiados intentos fallidos, usando REST como fallback');
            
            // Implementar polling por REST como fallback
            const pollInterval = 60000; // Cada minuto
            reconnectTimer = setTimeout(() => {
              // Reintentar WebSocket después de un tiempo
              retryCount = 0;
              createConnection();
            }, pollInterval);
            
            // Obtener notificaciones mediante REST mientras tanto con seguridad CSRF
            // Usamos una función autoejecutable asíncrona
            (async () => {
              try {
                // Usamos axios para beneficiarnos del manejo de CSRF y credenciales
                const api = (await import('../lib/axios')).default;
                const response = await api.get('/api/notifications');
                
                if (response.data.success && response.data.data) {
                  response.data.data.forEach((notification: any) => {
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
              } catch (err) {
                // Registramos el error pero no mostramos nada al usuario para evitar problemas UX
                console.error('Error al obtener notificaciones por REST:', err);
              }
            })();
          }
        }
      };
      
      return ws;
    };
    
    // Iniciar la conexión
    const connection = createConnection();
    
    // Devolver objeto mejorado con métodos adicionales
    return {
      close: () => {
        isIntentionalClose = true;
        clearTimers();
        
        if (connection && connection.readyState === WebSocket.OPEN) {
          connection.close(1000, 'Cierre intencional');
        }
      },
      reconnect: () => {
        retryCount = 0;
        createConnection();
      },
      connection
    };
  };
  
  return { connect };
}

// Hook para obtener notificaciones desde la API
export function useNotificationAPI() {
  const fetchNotifications = async (includeRead = false) => {
    try {
      // Usamos axios para beneficiarnos del manejo de CSRF y credenciales
      const api = (await import('../lib/axios')).default;
      const response = await api.get(`/api/notifications?includeRead=${includeRead}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al cargar notificaciones:', error);
      // Mostramos el mensaje de error de la API si está disponible
      if (error.response?.data?.message) {
        console.error('Mensaje de error:', error.response.data.message);
      }
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
      
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      // Refrescar proactivamente el token CSRF antes de una operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con manejo CSRF
      await api.post(`/api/notifications/${id}/read`);
      return true;
    } catch (error: any) {
      console.error('Error al marcar notificación como leída:', error);
      
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
            error.response?.data?.message?.includes('token') || 
            error.response?.data?.message?.includes('Token'))) {
        console.error("Error de validación de seguridad CSRF. Se intentará refrescar automáticamente.");
      }
      
      return false;
    }
  };
  
  const markAllAsRead = async () => {
    try {
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      // Refrescar proactivamente el token CSRF antes de una operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con manejo CSRF
      await api.post('/api/notifications/read-all');
      return true;
    } catch (error: any) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
            error.response?.data?.message?.includes('token') || 
            error.response?.data?.message?.includes('Token'))) {
        console.error("Error de validación de seguridad CSRF. Se intentará refrescar automáticamente.");
      }
      
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
      
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      // Refrescar proactivamente el token CSRF antes de una operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con manejo CSRF
      await api.post(`/api/notifications/${id}/archive`);
      return true;
    } catch (error: any) {
      console.error('Error al archivar notificación:', error);
      
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
            error.response?.data?.message?.includes('token') || 
            error.response?.data?.message?.includes('Token'))) {
        console.error("Error de validación de seguridad CSRF. Se intentará refrescar automáticamente.");
      }
      
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
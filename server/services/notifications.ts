import { WebSocket, WebSocketServer } from 'ws';
import { Server as HttpServer, IncomingMessage } from 'http';
import { User } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { db } from '@db/index';
import { notifications, users, notificationSettings } from '@db/schema';
import { log } from '../vite';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';

export interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdBy?: number;
}

interface ClientConnection {
  ws: WebSocket;
  userId: number;
  lastActivity: number;
}

let notificationsService: NotificationsService | null = null;

/**
 * Servicio para gestionar notificaciones en tiempo real
 */
export class NotificationsService {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ noServer: true });
    log('Servicio de notificaciones inicializado', 'notifications');

    // Configurar la actualización de la conexión WebSocket
    server.on('upgrade', (request: IncomingMessage, socket, head) => {
      const pathname = request.url;

      if (pathname?.startsWith('/api/ws/notifications')) {
        this.wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          this.wss.emit('connection', ws, request);
        });
      }
    });

    // Manejar nueva conexión
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const userId = parseInt(url.searchParams.get('userId') || '0');

      if (!userId) {
        ws.close(1008, 'userId requerido');
        return;
      }

      log(`Nueva conexión WebSocket para notificaciones: ${userId}`, 'notifications');

      // Registrar nueva conexión
      this.clients.set(ws, {
        ws,
        userId,
        lastActivity: Date.now()
      });

      // Enviar notificaciones no leídas al conectarse
      this.sendUnreadNotifications(userId, ws);

      // Configurar manejadores de eventos
      ws.on('message', (message: WebSocket.Data) => this.handleMessage(ws, message));
      ws.on('close', () => this.handleDisconnection(ws));
      ws.on('error', (error: Error) => {
        log(`Error en WebSocket: ${error.message}`, 'notifications');
        this.clients.delete(ws);
      });
    });

    // Configurar heartbeat para mantener vivas las conexiones
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30000);
  }

  /**
   * Envía notificaciones no leídas al conectar
   */
  private async sendUnreadNotifications(userId: number, ws: WebSocket) {
    try {
      const unreadNotifications = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false),
            eq(notifications.isArchived, false)
          )
        )
        .orderBy(notifications.createdAt);

      if (unreadNotifications.length > 0) {
        ws.send(JSON.stringify({
          type: 'unread_notifications',
          data: unreadNotifications
        }));
      }
    } catch (error) {
      log(`Error al obtener notificaciones no leídas: ${error}`, 'notifications');
    }
  }

  /**
   * Procesa los mensajes recibidos de los clientes
   */
  private handleMessage(ws: WebSocket, message: WebSocket.Data) {
    try {
      const data = JSON.parse(message.toString());
      const client = this.clients.get(ws);

      if (!client) return;

      // Actualizar marca de actividad
      client.lastActivity = Date.now();
      this.clients.set(ws, client);

      // Procesar comandos
      switch (data.type) {
        case 'mark_read':
          this.markNotificationAsRead(client.userId, data.notificationId);
          break;
        case 'mark_all_read':
          this.markAllNotificationsAsRead(client.userId);
          break;
        case 'archive':
          this.archiveNotification(client.userId, data.notificationId);
          break;
        case 'pong':
          // Respuesta al heartbeat, no se requiere acción
          break;
        case 'ping_client':
          // Responder al ping del cliente para confirmar que el servidor está vivo
          try {
            ws.send(JSON.stringify({ type: 'pong_server', timestamp: Date.now() }));
          } catch (e) {
            log(`Error al responder al ping del cliente: ${e}`, 'notifications');
          }
          break;
      }
    } catch (error) {
      log(`Error al procesar mensaje: ${error}`, 'notifications');
    }
  }

  /**
   * Maneja la desconexión de un cliente
   */
  private handleDisconnection(ws: WebSocket) {
    log(`Cliente de notificaciones desconectado`, 'notifications');
    this.clients.delete(ws);
  }

  /**
   * Envía un heartbeat a todos los clientes conectados
   */
  private sendHeartbeat() {
    const now = Date.now();
    this.clients.forEach((client, ws) => {
      if (now - client.lastActivity > 60000) {
        // Si el cliente no ha respondido en 1 minuto, cerramos la conexión
        ws.terminate();
        this.clients.delete(ws);
      } else {
        // Enviar ping
        try {
          ws.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          this.clients.delete(ws);
        }
      }
    });
  }

  /**
   * Marca una notificación como leída
   */
  private async markNotificationAsRead(userId: number, notificationId: number) {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        )
    } catch (error) {
      log(`Error al marcar notificación como leída: ${error}`, 'notifications');
    }
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  private async markAllNotificationsAsRead(userId: number) {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        )
    } catch (error) {
      log(`Error al marcar todas las notificaciones como leídas: ${error}`, 'notifications');
    }
  }

  /**
   * Archiva una notificación
   */
  private async archiveNotification(userId: number, notificationId: number) {
    try {
      await db
        .update(notifications)
        .set({ isArchived: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        )
    } catch (error) {
      log(`Error al archivar notificación: ${error}`, 'notifications');
    }
  }

  /**
   * Crea y envía una nueva notificación
   */
  public async createNotification(data: NotificationData): Promise<number | null> {
    try {
      // Verificar la configuración de notificaciones del usuario
      const settings = await db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, data.userId))
        .limit(1);
      
      const userSettings = settings[0] || { inAppEnabled: true };
      
      // Si el usuario ha desactivado las notificaciones, no enviamos
      if (!userSettings.inAppEnabled) {
        return null;
      }

      // Insertar notificación en la base de datos
      const [newNotification] = await db
        .insert(notifications)
        .values({
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
          relatedEntityType: data.relatedEntityType,
          relatedEntityId: data.relatedEntityId,
          createdBy: data.createdBy
        })
        .returning();

      // Enviar notificación en tiempo real si el usuario está conectado
      this.sendToUser(data.userId, {
        type: 'new_notification',
        data: newNotification
      });

      return newNotification.id;
    } catch (error) {
      log(`Error al crear notificación: ${error}`, 'notifications');
      return null;
    }
  }

  /**
   * Envía un mensaje a todas las conexiones activas de un usuario específico
   */
  private sendToUser(userId: number, message: any) {
    // Encontrar todas las conexiones activas de este usuario
    const userConnections: ClientConnection[] = [];
    
    this.clients.forEach(client => {
      if (client.userId === userId) {
        userConnections.push(client);
      }
    });
    
    // Contador para registrar a cuántas conexiones se envió el mensaje
    let successCount = 0;
    let closedCount = 0;
    let errorCount = 0;
    
    // Enviar a todas las conexiones activas del usuario
    if (userConnections.length > 0) {
      const jsonMessage = JSON.stringify(message);
      
      userConnections.forEach(connection => {
        try {
          // Verificar si la conexión está abierta
          if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(jsonMessage);
            successCount++;
          } else {
            closedCount++;
            this.clients.delete(connection.ws);
          }
        } catch (error) {
          errorCount++;
          log(`Error al enviar mensaje a una conexión del usuario ${userId}: ${error}`, 'notifications');
          this.clients.delete(connection.ws);
        }
      });
      
      log(`Notificación enviada a ${successCount}/${userConnections.length} conexiones del usuario ${userId}`, 'notifications');
    } else {
      log(`No se encontraron conexiones activas para el usuario ${userId}`, 'notifications');
    }
  }

  /**
   * Verifica si un usuario tiene configuración de notificaciones
   * Si no existe, crea la configuración predeterminada
   */
  public async ensureUserHasSettings(userId: number): Promise<void> {
    try {
      const settings = await db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId))
        .limit(1);
      
      if (settings.length === 0) {
        await db.insert(notificationSettings).values({ userId });
      }
    } catch (error) {
      log(`Error al verificar configuración de notificaciones: ${error}`, 'notifications');
    }
  }

  /**
   * Actualiza la configuración de notificaciones de un usuario
   */
  public async updateUserSettings(
    userId: number, 
    settings: Partial<Omit<typeof notificationSettings.$inferInsert, 'id' | 'userId'>>
  ): Promise<boolean> {
    try {
      await db
        .update(notificationSettings)
        .set(settings)
        .where(eq(notificationSettings.userId, userId));
      
      return true;
    } catch (error) {
      log(`Error al actualizar configuración de notificaciones: ${error}`, 'notifications');
      return false;
    }
  }

  /**
   * Obtiene las notificaciones de un usuario
   */
  public async getUserNotifications(userId: number, includeRead: boolean = false, limit: number = 50) {
    try {
      let query = db
        .select({
          notification: notifications,
          sender: {
            id: users.id,
            username: users.username,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl
          }
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.createdBy, users.id))
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isArchived, false),
            ! includeRead ? eq(notifications.isRead, false) : undefined
          )
        )
        .orderBy(notifications.createdAt);
      
      const results = await query.limit(limit);
      
      return results.map(({ notification, sender }) => ({
        ...notification,
        sender: sender?.id ? sender : undefined
      }));
    } catch (error) {
      log(`Error al obtener notificaciones del usuario: ${error}`, 'notifications');
      return [];
    }
  }

  /**
   * Obtiene la configuración de notificaciones de un usuario
   */
  public async getUserSettings(userId: number) {
    try {
      const settings = await db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId))
        .limit(1);
      
      return settings[0] || null;
    } catch (error) {
      log(`Error al obtener configuración de notificaciones: ${error}`, 'notifications');
      return null;
    }
  }

  /**
   * Envía notificación a todos los usuarios con un rol específico
   */
  public async notifyUsersWithRole(
    role: User['role'], 
    notification: Omit<NotificationData, 'userId'>
  ): Promise<void> {
    try {
      const usersWithRole = await db
        .select()
        .from(users)
        .where(eq(users.role, role));
      
      // Filtrar para excluir al usuario que está enviando la notificación
      const filteredUsers = usersWithRole.filter(user => 
        user.id !== notification.createdBy
      );
      
      log(`Enviando notificación a ${filteredUsers.length} usuarios con rol ${role} (excluyendo al remitente)`, 'notifications');
      
      for (const user of filteredUsers) {
        await this.createNotification({
          ...notification,
          userId: user.id
        });
      }
    } catch (error) {
      log(`Error al notificar a usuarios con rol ${role}: ${error}`, 'notifications');
    }
  }

  /**
   * Limpia recursos cuando el servicio se detiene
   */
  public shutdown() {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
    log('Servicio de notificaciones detenido', 'notifications');
  }
}

/**
 * Inicializa el servicio de notificaciones
 */
export function setupNotificationsService(server: HttpServer): NotificationsService {
  if (!notificationsService) {
    notificationsService = new NotificationsService(server);
    log('Servicio de notificaciones inicializado', 'notifications');
  }
  return notificationsService;
}

/**
 * Obtiene la instancia del servicio de notificaciones
 */
export function getNotificationsService(): NotificationsService | null {
  return notificationsService;
}
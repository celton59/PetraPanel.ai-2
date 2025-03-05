import { Server as HttpServer } from 'http';
import * as WebSocketModule from 'ws';
import { User } from '../../db/schema';
import { log } from '../vite';
import { IncomingMessage } from 'http';

// Alias para tipado y uso como valor
const WebSocketServer = WebSocketModule.WebSocketServer;
type WebSocket = WebSocketModule.WebSocket;
const OPEN = WebSocketModule.WebSocket.OPEN;

interface ClientConnection {
  ws: WebSocket;
  userId: number;
  lastActivity: number;
}

/**
 * Servicio para gestionar usuarios conectados en tiempo real
 */
export class OnlineUsersService {
  private wss: typeof WebSocketServer;
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private activeUsers: Map<number, { lastActivity: number; username: string; }> = new Map();
  private heartbeatInterval: NodeJS.Timeout;
  
  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ 
      noServer: true,
      path: '/ws/online-users'
    });
    
    // Configurar upgrade de conexión HTTP a WebSocket
    server.on('upgrade', (request, socket, head) => {
      if (request.url?.startsWith('/ws/online-users')) {
        this.wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          this.wss.emit('connection', ws, request);
        });
      }
    });
    
    // Manejar conexiones de clientes
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      log('Nueva conexión WebSocket para usuarios en línea', 'ws');
      
      // Configurar manejadores de eventos
      ws.on('message', (message: WebSocketModule.Data) => this.handleMessage(ws, message));
      ws.on('close', () => this.handleDisconnection(ws));
      ws.on('error', (error: Error) => {
        log(`Error en WebSocket: ${error.message}`, 'ws');
        this.handleDisconnection(ws);
      });
      
      // Enviar configuración inicial
      ws.send(JSON.stringify({
        type: 'config',
        heartbeatInterval: 30000 // 30 segundos
      }));
    });
    
    // Iniciar verificación periódica de conexiones activas
    this.heartbeatInterval = setInterval(() => this.checkActiveConnections(), 60000);
    
    log('Servicio de usuarios en línea inicializado', 'ws');
  }
  
  /**
   * Procesa los mensajes recibidos de los clientes
   */
  private handleMessage(ws: WebSocket, message: WebSocketModule.Data) {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'login': {
          // Registro inicial de usuario conectado
          if (data.userId && data.username) {
            const userId = parseInt(data.userId, 10);
            this.clients.set(ws, { 
              ws, 
              userId,
              lastActivity: Date.now()
            });
            
            this.activeUsers.set(userId, {
              lastActivity: Date.now(),
              username: data.username
            });
            
            log(`Usuario conectado: ${data.username} (${data.userId})`, 'ws');
            this.broadcastActiveUsers();
          }
          break;
        }
        
        case 'heartbeat': {
          // Actualizar timestamp de actividad
          const client = this.clients.get(ws);
          if (client) {
            client.lastActivity = Date.now();
            
            const activeUser = this.activeUsers.get(client.userId);
            if (activeUser) {
              activeUser.lastActivity = Date.now();
            }
          }
          break;
        }
        
        default:
          // Ignorar mensajes no reconocidos
          break;
      }
    } catch (err) {
      log('Error al procesar mensaje WebSocket', 'ws');
    }
  }
  
  /**
   * Maneja la desconexión de un cliente
   */
  private handleDisconnection(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (client) {
      log(`Usuario desconectado: ${client.userId}`, 'ws');
      this.clients.delete(ws);
      
      // No eliminamos inmediatamente el usuario activo para permitir
      // reconexiones rápidas (se limpiará en el próximo heartbeat si no se reconecta)
      this.broadcastActiveUsers();
    }
  }
  
  /**
   * Verifica conexiones activas y elimina usuarios inactivos
   */
  private checkActiveConnections() {
    const now = Date.now();
    const inactivityThreshold = 2 * 60 * 1000; // 2 minutos
    
    // Buscar usuarios inactivos
    const inactiveUserIds: number[] = [];
    this.activeUsers.forEach((data, userId) => {
      if (now - data.lastActivity > inactivityThreshold) {
        inactiveUserIds.push(userId);
      }
    });
    
    // Eliminar usuarios inactivos
    if (inactiveUserIds.length > 0) {
      inactiveUserIds.forEach(id => {
        this.activeUsers.delete(id);
        log(`Usuario marcado como inactivo: ${id}`, 'ws');
      });
      
      // Notificar a todos los clientes
      this.broadcastActiveUsers();
    }
  }
  
  /**
   * Envía la lista de usuarios activos a todos los clientes conectados
   */
  private broadcastActiveUsers() {
    const activeUsersList = Array.from(this.activeUsers.entries()).map(([userId, data]) => ({
      userId,
      username: data.username,
      lastActivity: data.lastActivity
    }));
    
    const message = JSON.stringify({
      type: 'active_users',
      users: activeUsersList
    });
    
    this.clients.forEach(client => {
      if (client.ws.readyState === OPEN) {
        client.ws.send(message);
      }
    });
  }
  
  /**
   * Limpia recursos cuando el servicio se detiene
   */
  public shutdown() {
    clearInterval(this.heartbeatInterval);
    
    // Cerrar todas las conexiones WebSocket
    this.clients.forEach(client => {
      try {
        client.ws.close();
      } catch (err) {
        // Ignorar errores en desconexión
      }
    });
    
    this.clients.clear();
    this.activeUsers.clear();
    
    log('Servicio de usuarios en línea detenido', 'ws');
  }
  
  /**
   * Obtiene la lista de usuarios activos
   */
  public getActiveUsers() {
    return Array.from(this.activeUsers.entries()).map(([userId, data]) => ({
      userId,
      username: data.username,
      lastActivity: data.lastActivity
    }));
  }
  
  /**
   * Verifica si un usuario está activo
   */
  public isUserActive(userId: number): boolean {
    return this.activeUsers.has(userId);
  }
  
  /**
   * Registra actividad de un usuario (para APIs REST)
   * Útil para actualizar estado de usuario sin WebSocket
   */
  public registerUserActivity(user: User) {
    if (!user || !user.id) return;
    
    const existingUser = this.activeUsers.get(user.id);
    if (existingUser) {
      existingUser.lastActivity = Date.now();
    } else {
      this.activeUsers.set(user.id, {
        lastActivity: Date.now(),
        username: user.username
      });
      this.broadcastActiveUsers();
    }
  }
}

// Instancia única del servicio
let onlineUsersServiceInstance: OnlineUsersService | null = null;

/**
 * Inicializa el servicio de usuarios online
 */
export function setupOnlineUsersService(server: HttpServer): OnlineUsersService {
  if (!onlineUsersServiceInstance) {
    onlineUsersServiceInstance = new OnlineUsersService(server);
  }
  return onlineUsersServiceInstance;
}

/**
 * Obtiene la instancia del servicio de usuarios online
 */
export function getOnlineUsersService(): OnlineUsersService | null {
  return onlineUsersServiceInstance;
}
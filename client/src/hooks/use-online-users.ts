import { useState, useEffect, useRef } from 'react';
import { useUser } from './use-user';

export interface OnlineUser {
  userId: number;
  username: string;
  lastActivity: number;
}

/**
 * Hook para gestionar la lista de usuarios conectados en tiempo real
 */
export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  
  // Referencias para mantener estado entre renders
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    const connectToWebsocket = () => {
      if (!user?.id) return;
      
      try {
        // Limpiar conexión anterior si existe
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        
        // Limpiar heartbeat si existe
        if (heartbeatIntervalRef.current) {
          window.clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        
        setIsConnecting(true);
        setError(null);
        
        // Crear nueva conexión WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/online-users`;
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;
        
        socket.onopen = () => {
          console.log('Conexión WebSocket establecida');
          setIsConnected(true);
          setIsConnecting(false);
          
          // Enviar información de inicio de sesión
          socket.send(JSON.stringify({
            type: 'login',
            userId: user.id,
            username: user.username
          }));
        };
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'config': {
                // Configurar heartbeat según indicación del servidor
                if (data.heartbeatInterval && !heartbeatIntervalRef.current) {
                  heartbeatIntervalRef.current = window.setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN) {
                      socket.send(JSON.stringify({ type: 'heartbeat' }));
                    }
                  }, data.heartbeatInterval);
                }
                break;
              }
              
              case 'active_users': {
                // Actualizar lista de usuarios activos
                if (Array.isArray(data.users)) {
                  setOnlineUsers(data.users);
                }
                break;
              }
            }
          } catch (err) {
            console.error('Error al procesar mensaje WebSocket:', err);
          }
        };
        
        socket.onclose = () => {
          console.log('Conexión WebSocket cerrada');
          setIsConnected(false);
          setIsConnecting(false);
          
          // Limpiar heartbeat
          if (heartbeatIntervalRef.current) {
            window.clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
          
          // Intentar reconectar después de un tiempo
          setTimeout(connectToWebsocket, 5000);
        };
        
        socket.onerror = (e) => {
          console.error('Error en conexión WebSocket:', e);
          setError('Error en la conexión. Reconectando...');
          setIsConnected(false);
          
          // El evento onclose se disparará automáticamente
        };
      } catch (err) {
        console.error('Error al establecer conexión WebSocket:', err);
        setError('Error al conectar con el servidor');
        setIsConnected(false);
        setIsConnecting(false);
      }
    };
    
    // Conectar solo si hay un usuario autenticado
    if (user?.id) {
      connectToWebsocket();
    } else {
      // Desconectar si no hay usuario
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      setIsConnected(false);
      setOnlineUsers([]);
    }
    
    // Limpiar al desmontar
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [user?.id]);
  
  return {
    onlineUsers,
    isConnected,
    isConnecting,
    error
  };
}
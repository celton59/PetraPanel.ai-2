import { useState, useEffect, useRef } from 'react';
import { useUser } from './use-user';
import axios from 'axios';

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
  const [useRestFallback, setUseRestFallback] = useState(false);
  const { user } = useUser();
  
  // Referencias para mantener estado entre renders
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const restFallbackIntervalRef = useRef<number | null>(null);
  
  // Función para obtener usuarios activos mediante API REST
  const fetchOnlineUsersRest = async () => {
    try {
      const response = await axios.get('/api/online-users');
      if (response.data.success && Array.isArray(response.data.data)) {
        setOnlineUsers(response.data.data);
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error al obtener usuarios en línea vía REST:', err);
      setError('Error al actualizar usuarios activos');
    }
  };
  
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
          setUseRestFallback(false);
          
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
          
          // Cambiar a modo REST si hay muchos intentos fallidos
          setUseRestFallback(true);
          
          // Intentar reconectar después de un tiempo
          setTimeout(connectToWebsocket, 5000);
        };
        
        socket.onerror = (e) => {
          console.error('Error en conexión WebSocket:', e);
          setError('Error en la conexión. Usando alternativa...');
          setIsConnected(false);
          setUseRestFallback(true);
          
          // El evento onclose se disparará automáticamente
        };
      } catch (err) {
        console.error('Error al establecer conexión WebSocket:', err);
        setError('Error al conectar con el servidor');
        setIsConnected(false);
        setIsConnecting(false);
        setUseRestFallback(true);
      }
    };
    
    // Iniciar modo REST si WebSocket falla
    const setupRestFallback = () => {
      // Limpiar intervalo existente si hay
      if (restFallbackIntervalRef.current) {
        window.clearInterval(restFallbackIntervalRef.current);
        restFallbackIntervalRef.current = null;
      }
      
      // Obtener datos inmediatamente
      fetchOnlineUsersRest();
      
      // Configurar intervalo para actualizaciones periódicas
      restFallbackIntervalRef.current = window.setInterval(fetchOnlineUsersRest, 30000); // cada 30 segundos
    };
    
    // Conectar solo si hay un usuario autenticado
    if (user?.id) {
      if (useRestFallback) {
        setupRestFallback();
      } else {
        connectToWebsocket();
      }
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
      
      if (restFallbackIntervalRef.current) {
        window.clearInterval(restFallbackIntervalRef.current);
        restFallbackIntervalRef.current = null;
      }
      
      setIsConnected(false);
      setOnlineUsers([]);
    }
    
    // Añadir evento para detectar cierre de ventana/pestaña
    const handleBeforeUnload = () => {
      // Enviar mensaje de cierre explícito al servidor
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && user?.id) {
        wsRef.current.send(JSON.stringify({
          type: 'logout',
          userId: user.id,
          username: user.username
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

  // Limpiar al desmontar
  return () => {
    // Eliminar el evento beforeunload
    window.removeEventListener('beforeunload', handleBeforeUnload);
    
    // Enviar mensaje de logout explícito
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && user?.id) {
      try {
        // Intentar enviar mensaje de cierre
        wsRef.current.send(JSON.stringify({
          type: 'logout',
          userId: user.id,
          username: user.username
        }));
      } catch (e) {
        console.error('Error al enviar mensaje de logout:', e);
      }
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      window.clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    if (restFallbackIntervalRef.current) {
      window.clearInterval(restFallbackIntervalRef.current);
      restFallbackIntervalRef.current = null;
    }
  };
  }, [user?.id, useRestFallback]);
  
  return {
    onlineUsers,
    isConnected,
    isConnecting,
    error,
    usingFallback: useRestFallback
  };
}
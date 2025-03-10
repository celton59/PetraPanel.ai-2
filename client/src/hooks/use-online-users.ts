
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
  const reconnectTimeoutRef = useRef<number | null>(null);
  const connectionAttemptsRef = useRef(0);
  
  // Función para obtener usuarios activos mediante API REST con caché
  const fetchOnlineUsersRest = async () => {
    try {
      // Usar caché del navegador para reducir el tiempo de carga
      const response = await axios.get('/api/online-users', {
        headers: {
          'Cache-Control': 'max-age=5' // Caché de 5 segundos
        }
      });
      
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
  
  // Iniciar la carga inmediata de usuarios en línea para mejorar tiempos de respuesta
  useEffect(() => {
    // Esta función asegura que tengamos datos iniciales lo más rápido posible
    const loadInitialData = async () => {
      if (user?.id) {
        try {
          const response = await axios.get('/api/online-users');
          if (response.data.success && Array.isArray(response.data.data)) {
            setOnlineUsers(response.data.data);
            setIsConnected(true);
          }
        } catch (err) {
          console.error('Error en carga inicial de usuarios en línea:', err);
        }
      }
    };
    
    // Ejecutar inmediatamente para tener datos rápidos
    loadInitialData();
  }, [user?.id]); // Solo disparar cuando cambie el usuario

  useEffect(() => {
    // Si no hay usuario autenticado, no intentar conectarse
    if (!user?.id) return;
    
    // Función para manejar cierre limpio de conexión
    const handleBeforeUnload = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && user?.id) {
        wsRef.current.send(JSON.stringify({
          type: 'logout',
          userId: user.id,
          username: user.username
        }));
      }
    };
    
    // Función para limpiar todos los intervalos y timeouts
    const clearAllTimers = () => {
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      if (restFallbackIntervalRef.current) {
        window.clearInterval(restFallbackIntervalRef.current);
        restFallbackIntervalRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
    
    // Función para establecer la conexión WebSocket
    const connectWebSocket = () => {
      // Si ya hay una conexión activa o estamos usando fallback, no hacer nada
      if (
        (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) || 
        useRestFallback
      ) {
        return;
      }
      
      // Limpiar conexión anterior si existe
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      setIsConnecting(true);
      connectionAttemptsRef.current++;
      
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/online-users`;
        
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
          connectionAttemptsRef.current = 0;
          
          // Enviar mensaje de login al conectar
          if (wsRef.current && user?.id) {
            wsRef.current.send(JSON.stringify({
              type: 'login',
              userId: user.id,
              username: user.username
            }));
          }
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'users_update') {
              setOnlineUsers(data.users);
            } else if (data.type === 'config') {
              // Configurar heartbeat - Cada 2 minutos (120000ms)
              if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
              }
              
              heartbeatIntervalRef.current = window.setInterval(() => {
                if (wsRef.current?.readyState === WebSocket.OPEN && user?.id) {
                  wsRef.current.send(JSON.stringify({
                    type: 'heartbeat',
                    userId: user.id
                  }));
                }
              }, 120000); // 2 minutos
            }
          } catch (err) {
            console.error('Error al procesar mensaje WebSocket:', err);
          }
        };
        
        wsRef.current.onclose = () => {
          setIsConnected(false);
          
          // Si tenemos demasiados intentos fallidos, cambiar a REST
          if (connectionAttemptsRef.current >= 3) {
            console.log('Demasiados intentos fallidos, usando REST como fallback');
            setUseRestFallback(true);
            setIsConnecting(false);
            return;
          }
          
          // Intentar reconectar después de un delay exponencial
          const reconnectDelay = Math.min(30000, Math.pow(2, connectionAttemptsRef.current) * 1000);
          console.log(`Reconectando en ${reconnectDelay}ms...`);
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectWebSocket();
          }, reconnectDelay);
        };
        
        wsRef.current.onerror = () => {
          if (wsRef.current) {
            wsRef.current.close();
          }
        };
      } catch (err) {
        console.error('Error al conectar WebSocket:', err);
        setIsConnected(false);
        setIsConnecting(false);
        setError('Error al conectar con el servidor');
        
        // Intentar reconectar después de un delay
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket();
        }, 5000);
      }
    };
    
    // Iniciar conexión principal o fallback
    if (useRestFallback) {
      // Usar REST si WebSocket falló demasiadas veces
      fetchOnlineUsersRest();
      
      // Iniciar intervalo para actualizar usuarios vía REST (cada 30 segundos)
      if (!restFallbackIntervalRef.current) {
        restFallbackIntervalRef.current = window.setInterval(fetchOnlineUsersRest, 30000);
      }
    } else {
      // Intentar conexión WebSocket
      connectWebSocket();
    }
    
    // Registrar evento beforeunload para cerrar conexión limpiamente
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup al desmontar componente
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Enviar mensaje de logout si es posible
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && user?.id) {
        try {
          wsRef.current.send(JSON.stringify({
            type: 'logout',
            userId: user.id,
            username: user.username
          }));
        } catch (e) {
          console.error('Error al enviar mensaje de logout:', e);
        }
      }
      
      // Cerrar WebSocket si existe
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      // Limpiar todos los intervalos y timeouts
      clearAllTimers();
    };
  }, [user?.id, useRestFallback]); // Solo re-ejecutar cuando el usuario o el modo fallback cambian
  
  return {
    onlineUsers,
    isConnected,
    isConnecting,
    error,
    usingFallback: useRestFallback
  };
}

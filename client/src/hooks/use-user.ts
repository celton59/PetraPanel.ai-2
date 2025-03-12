import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@db/schema";
import api from "../lib/axios";

type RequestResult = {
  ok: true;
  message?: string;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: { username: string; password: string; }
): Promise<RequestResult> {
  try {
    // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
    const { refreshCSRFToken } = await import('../lib/axios');
    const api = (await import('../lib/axios')).default;
    
    // Refrescar proactivamente el token CSRF para operaciones importantes
    if (method.toUpperCase() !== 'GET') {
      await refreshCSRFToken();
    }
    
    // Configurar la petición según el método
    let response;
    if (method.toUpperCase() === 'GET') {
      response = await api.get(url);
    } else if (method.toUpperCase() === 'POST') {
      response = await api.post(url, body || {});
    } else if (method.toUpperCase() === 'PUT') {
      response = await api.put(url, body || {});
    } else if (method.toUpperCase() === 'DELETE') {
      response = await api.delete(url);
    } else {
      throw new Error(`Método no soportado: ${method}`);
    }
    
    return { ok: true, message: response.data?.message };
  } catch (e: any) {
    console.error("Request error:", e);
    
    // Manejo mejorado de errores
    if (e.response) {
      // Errores del servidor
      if (e.response.status >= 500) {
        return { ok: false, message: "Error del servidor, intente más tarde" };
      }
      
      // Errores de CSRF
      if (e.response.status === 403 && 
          (e.response.data?.message?.includes('CSRF') || 
           e.response.data?.message?.includes('token') || 
           e.response.data?.message?.includes('Token'))) {
        return { ok: false, message: "Error de validación de seguridad. Intente de nuevo." };
      }
      
      // Otros errores con mensajes del servidor
      return { 
        ok: false, 
        message: e.response.data?.message || "Error en la petición" 
      };
    }
    
    // Errores de red u otros
    return { ok: false, message: "Error de conexión" };
  }
}

async function fetchUser(): Promise<User | null> {
  try {
    // Importamos api y refreshCSRFToken
    const { refreshCSRFToken } = await import('../lib/axios');
    const api = (await import('../lib/axios')).default;
    
    // Refrescar token CSRF para asegurar que está disponible
    await refreshCSRFToken();
    
    // Intentamos obtener el usuario
    const response = await api.get('/api/user');
    console.log("CSRF Token obtenido correctamente");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching user:", error);
    
    // Si es 401 No autorizado, simplemente devolvemos null (no autenticado)
    if (error.response && error.response.status === 401) {
      return null;
    }
    
    // Si hay error de CSRF, intentamos refrescar el token y reintentamos
    if (error.response?.status === 403 && 
        (error.response?.data?.message?.includes('CSRF') || 
         error.response?.data?.message?.includes('token'))) {
      try {
        const { refreshCSRFToken } = await import('../lib/axios');
        await refreshCSRFToken(true); // Forzar actualización
        
        // Reintentamos la petición
        const api = (await import('../lib/axios')).default;
        const retryResponse = await api.get('/api/user');
        return retryResponse.data;
      } catch (retryError) {
        console.error("Error en reintento de fetchUser:", retryError);
        return null;
      }
    }
    
    // Para otros errores, informamos pero no interrumpimos la aplicación
    console.warn("Error no crítico al obtener usuario:", error.message);
    return null;
  }
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading, refetch } = useQuery({
    queryKey: ['/api/user'],
    queryFn: fetchUser,
    staleTime: 60000,         // 1 minuto antes de considerar los datos obsoletos
    refetchOnWindowFocus: false, // No recargar al cambiar de pestaña
    retry: 1                  // Solo intentar una vez si falla
  });

  const loginMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; rememberMe?: boolean }) => {
      console.log("Iniciando sesión con:", { username: userData.username, rememberMe: userData.rememberMe });
      
      async function attemptLogin(forceNewToken = false) {
        try {
          // Importamos api y refreshCSRFToken
          const { refreshCSRFToken } = await import('../lib/axios');
          const api = (await import('../lib/axios')).default;
          
          // Refrescar proactivamente el token CSRF
          await refreshCSRFToken(forceNewToken);
          
          // Obtener el token actual para enviarlo en la cabecera
          const csrfToken = localStorage.getItem('csrfToken');
          
          // Crear configuración con cabeceras explícitas para asegurar el envío del token
          const config = {
            headers: {
              'X-CSRF-Token': csrfToken,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          };
          
          // Realizar la petición con la configuración explícita
          const response = await api.post('/api/login', userData, config);
          return response.data;
        } catch (error) {
          throw error;
        }
      }
      
      try {
        // Primer intento
        return await attemptLogin();
      } catch (error: any) {
        console.error("Error en primer intento de inicio de sesión:", error);
        
        // Si hay error de CSRF, intentar de nuevo con token forzado
        if (error.response?.status === 403 && 
           (error.response?.data?.message?.includes('CSRF') || 
            error.response?.data?.message?.includes('token'))) {
          try {
            console.log("Reintentando login con nuevo token CSRF...");
            return await attemptLogin(true);
          } catch (retryError: any) {
            console.error("Error en segundo intento de inicio de sesión:", retryError);
            
            // Mensaje personalizado para el error final
            if (retryError.response?.status === 401) {
              throw new Error("Nombre de usuario o contraseña incorrectos");
            } else if (retryError.response?.data?.message) {
              throw new Error(retryError.response.data.message);
            } else {
              throw new Error("Error al iniciar sesión. Intente de nuevo.");
            }
          }
        }
        
        // Para el error 401, dar un mensaje amigable
        if (error.response?.status === 401) {
          throw new Error("Nombre de usuario o contraseña incorrectos");
        }
        
        // Extrae el mensaje de error de la respuesta de Axios
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        
        // Error genérico
        throw new Error("Error al iniciar sesión. Intente de nuevo.");
      }
    },
    onSuccess: (data) => {
      // Actualizamos el estado de autenticación
      queryClient.setQueryData(['/api/user'], data);
      
      // Forzamos una recarga de queries que dependen del estado de autenticación
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Iniciando cierre de sesión");
      
      try {
        // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
        const { refreshCSRFToken } = await import('../lib/axios');
        const api = (await import('../lib/axios')).default;
        
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.post('/api/logout');
        return response.data;
      } catch (error: any) {
        console.error("Error en logout:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Intente de nuevo.");
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Sesión cerrada correctamente");
      queryClient.setQueryData(['/api/user'], null);
      
      // Redirección manual para evitar problemas de cache
      window.location.href = "/";
    },
  });

  // const registerMutation = useMutation({
  //   mutationFn: async (userData: { username: string; password: string; }) => {
  //     try {
  //       // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
  //       const { refreshCSRFToken } = await import('../lib/axios');
  //       const api = (await import('../lib/axios')).default;
  //       
  //       // Refrescar proactivamente el token CSRF antes de una operación importante
  //       await refreshCSRFToken();
  //       
  //       // Usar nuestra instancia de axios configurada con manejo CSRF
  //       const response = await api.post('/api/register', userData);
  //       return response.data;
  //     } catch (error: any) {
  //       console.error("Error registering user:", error);
  //       
  //       // Manejo mejorado de errores
  //       if (error.response?.data?.message) {
  //         throw new Error(error.response.data.message);
  //       }
  //       
  //       throw new Error("Error al registrar usuario");
  //     }
  //   },
  //   onSuccess: (data) => {
  //     queryClient.setQueryData(['/api/user'], data);
  //   },
  // });

  return {
    user,
    error,
    isLoading,
    refetch,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync
  };
}
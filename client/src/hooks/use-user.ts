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
    // Importamos api dinámicamente para asegurar que siempre usamos la instancia más actualizada
    const api = (await import('../lib/axios')).default;
    const response = await api.get('/api/user');
    return response.data;
  } catch (error: any) {
    console.error("Error fetching user:", error);
    if (error.response && error.response.status === 401) {
      return null;
    }
    throw error;
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
      
      try {
        // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
        const { refreshCSRFToken } = await import('../lib/axios');
        const api = (await import('../lib/axios')).default;
        
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.post('/api/login', userData);
        return response.data;
      } catch (error: any) {
        console.error("Error en inicio de sesión:", error);
        // Extrae el mensaje de error de la respuesta de Axios
        if (error.response && error.response.data) {
          throw new Error(error.response.data.message || "Error en inicio de sesión");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Si la respuesta contiene usuario, usarlo directamente
      if (data.user) {
        queryClient.setQueryData(['/api/user'], data.user);
      } else {
        // Si no, actualizar con una sola consulta específica
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      }
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
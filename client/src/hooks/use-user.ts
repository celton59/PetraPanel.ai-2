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
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status >= 500) {
        return { ok: false, message: "Error del servidor, intente más tarde" };
      }
      const text = await response.text();
      let message;
      try {
        const data = JSON.parse(text);
        message = data.message || text;
      } catch {
        message = text;
      }
      return { ok: false, message };
    }

    return { ok: true };
  } catch (e: any) {
    console.error("Request error:", e);
    return { ok: false, message: "Error de conexión" };
  }
}

async function fetchUser(): Promise<User | null> {
  try {
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
        // Primero, obtenemos un CSRF token actualizado
        const csrfResponse = await axios.get('/api/csrf-token', { withCredentials: true });
        const csrfToken = csrfResponse.headers['x-csrf-token'] || 
                           (csrfResponse.data && csrfResponse.data.csrfToken);
                           
        if (csrfToken) {
          localStorage.setItem('csrf-token', csrfToken);
          // Actualizar meta tag en document
          let metaTag = document.querySelector('meta[name="csrf-token"]');
          if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'csrf-token');
            document.head.appendChild(metaTag);
          }
          metaTag.setAttribute('content', csrfToken);
          
          // Asegurarse de que el interceptor tenga el token actualizado
          api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
        }
        
        // Ahora intentamos el login con el token actualizado
        const response = await api.post('/api/login', userData);
        console.log("Respuesta del servidor:", response.data);
        
        // Verificar cabeceras de la respuesta en busca de un nuevo token CSRF
        const newCsrfToken = response.headers['x-csrf-token'];
        if (newCsrfToken) {
          localStorage.setItem('csrf-token', newCsrfToken);
          let metaTag = document.querySelector('meta[name="csrf-token"]');
          if (metaTag) {
            metaTag.setAttribute('content', newCsrfToken);
          }
          api.defaults.headers.common['X-CSRF-Token'] = newCsrfToken;
        }
        
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
      // La respuesta ahora incluye el usuario dentro de un objeto user
      if (data.user) {
        console.log("Usuario autenticado correctamente:", data.user);
        queryClient.setQueryData(['/api/user'], data.user);
      } else {
        // Si por alguna razón el formato es el antiguo (el usuario directamente)
        console.log("Formato antiguo de respuesta detectado");
        queryClient.setQueryData(['/api/user'], data);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Iniciando cierre de sesión");
      
      try {
        const response = await api.post('/api/logout');
        return response.data;
      } catch (error: any) {
        console.error("Error en logout:", error);
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
  //     const response = await fetch('/api/register', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(userData),
  //       credentials: 'include',
  //     });

  //     if (!response.ok) {
  //       const text = await response.text();
  //       throw new Error(text);
  //     }

  //     return response.json();
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
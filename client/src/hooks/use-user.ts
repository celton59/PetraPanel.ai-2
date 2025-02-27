import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@db/schema";

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
    // Detectar dominio petrapanel.ai para manejar Cloudflare Flexible SSL
    const isPetraPanelDomain = 
      window.location.host === 'petrapanel.ai' || 
      window.location.host === 'www.petrapanel.ai' ||
      window.location.host === 'petra-panel-ai-celton59.replit.app';

    // Log información para depuración
    console.log('Realizando solicitud API:', {
      url,
      host: window.location.host,
      protocol: window.location.protocol,
      isPetraPanelDomain
    });

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
      console.error('API error:', {
        status: response.status,
        url,
        message
      });
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
    // Detectar entorno petrapanel.ai para diagnóstico
    const isPetraPanelDomain = 
      window.location.host === 'petrapanel.ai' || 
      window.location.host === 'www.petrapanel.ai' ||
      window.location.host === 'petra-panel-ai-celton59.replit.app';
    
    console.log('Verificando usuario en:', {
      host: window.location.host,
      protocol: window.location.protocol,
      isPetraPanelDomain
    });
    
    const response = await fetch('/api/user', {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('No autenticado, redirigiendo a login', {
          status: response.status,
          host: window.location.host
        });
        return null;
      }
      const errorText = await response.text();
      console.error('Error obteniendo usuario:', {
        status: response.status,
        error: errorText,
        host: window.location.host
      });
      throw new Error(errorText);
    }

    const data = await response.json();
    console.log('Usuario autenticado correctamente:', {
      username: data.username,
      role: data.role,
      host: window.location.host
    });
    return data;
  } catch (error) {
    console.error("Error fetchUser:", error);
    throw error;
  }
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading, refetch } = useQuery({
    queryKey: ['/api/user'],
    queryFn: fetchUser,
    staleTime: 0,
    retry: 1,
  });

  const loginMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; }) => {
      // Detectar dominio petrapanel.ai para manejar Cloudflare Flexible SSL
      const isPetraPanelDomain = 
        window.location.host === 'petrapanel.ai' || 
        window.location.host === 'www.petrapanel.ai' ||
        window.location.host === 'petra-panel-ai-celton59.replit.app';
        
      console.log('Intentando login en:', {
        host: window.location.host,
        protocol: window.location.protocol,
        isPetraPanelDomain,
        username: userData.username
      });
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Error de login:', {
          status: response.status,
          error: text,
          host: window.location.host
        });
        throw new Error(text);
      }

      console.log('Login exitoso para usuario:', userData.username);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Estableciendo datos de usuario tras login exitoso:', data.username);
      queryClient.invalidateQueries()
      queryClient.setQueryData(['/api/user'], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const result = await handleRequest('/api/logout', 'POST');
      if (!result.ok) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; }) => {
      // Detectar dominio petrapanel.ai para manejar Cloudflare Flexible SSL
      const isPetraPanelDomain = 
        window.location.host === 'petrapanel.ai' || 
        window.location.host === 'www.petrapanel.ai' ||
        window.location.host === 'petra-panel-ai-celton59.replit.app';
        
      console.log('Intentando registro en:', {
        host: window.location.host,
        protocol: window.location.protocol,
        isPetraPanelDomain,
        username: userData.username
      });
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Error de registro:', {
          status: response.status,
          error: text,
          host: window.location.host
        });
        throw new Error(text);
      }

      console.log('Registro exitoso para usuario:', userData.username);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Estableciendo datos de usuario tras registro exitoso:', data.username);
      queryClient.invalidateQueries()
      queryClient.setQueryData(['/api/user'], data);
    },
  });

  return {
    user,
    error,
    isLoading,
    refetch,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}
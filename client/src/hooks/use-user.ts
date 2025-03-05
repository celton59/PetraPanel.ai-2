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
    const response = await fetch('/api/user', {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(await response.text());
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
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
    mutationFn: async (userData: { username: string; password: string; rememberMe?: boolean }) => {
      console.log("Intentando iniciar sesión con:", { username: userData.username, rememberMe: userData.rememberMe });
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
          credentials: 'include',
        });

        const contentType = response.headers.get('content-type');
        let data;
        
        // Parsear la respuesta según su tipo
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.log("Respuesta no JSON:", text);
          data = { success: response.ok, message: text };
        }
        
        // Si no es exitoso, lanzar error con el mensaje
        if (!response.ok) {
          throw new Error(data.message || "Error en el inicio de sesión");
        }
        
        console.log("Inicio de sesión exitoso:", data);
        return data;
      } catch (error: any) {
        console.error("Error en login:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Login exitoso, actualizando estado:", data);
      
      // Si la respuesta contiene un usuario, usarlo directamente
      if (data.user) {
        queryClient.setQueryData(['/api/user'], data.user);
      } else {
        // De lo contrario, recargar los datos del usuario
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Iniciando proceso de logout");
      
      try {
        const response = await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        
        const contentType = response.headers.get('content-type');
        let data;
        
        // Parsear la respuesta según su tipo
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.log("Respuesta no JSON:", text);
          data = { success: response.ok, message: text };
        }
        
        // Si no es exitoso, lanzar error con el mensaje
        if (!response.ok) {
          throw new Error(data.message || "Error al cerrar sesión");
        }
        
        console.log("Logout exitoso:", data);
        return data;
      } catch (error: any) {
        console.error("Error en logout:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Logout exitoso, limpiando estado");
      queryClient.setQueryData(['/api/user'], null);
      // Redirección inmediata a la página de login
      window.location.replace("/");
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
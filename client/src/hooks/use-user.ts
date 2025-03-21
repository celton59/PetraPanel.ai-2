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
    const { refreshCSRFToken } = await import('../lib/axios');
    const api = (await import('../lib/axios')).default;

    if (method.toUpperCase() !== 'GET') {
      await refreshCSRFToken();
    }

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

    if (e.response) {
      if (e.response.status >= 500) {
        return { ok: false, message: "Error del servidor, intente más tarde" };
      }

      if (e.response.status === 403 &&
        (e.response.data?.message?.includes('CSRF') ||
          e.response.data?.message?.includes('token') ||
          e.response.data?.message?.includes('Token'))) {
        return { ok: false, message: "Error de validación de seguridad. Intente de nuevo." };
      }

      return {
        ok: false,
        message: e.response.data?.message || "Error en la petición"
      };
    }

    return { ok: false, message: "Error de conexión" };
  }
}

async function fetchUser(): Promise<User | null> {
  try {
    const { refreshCSRFToken } = await import('../lib/axios');
    const api = (await import('../lib/axios')).default;

    await refreshCSRFToken();

    const response = await api.get('/api/user');
    console.log("CSRF Token obtenido correctamente");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching user:", error);

    if (error.response && error.response.status === 401) {
      return null;
    }

    if (error.response?.status === 403 &&
      (error.response?.data?.message?.includes('CSRF') ||
        error.response?.data?.message?.includes('token'))) {
      try {
        const { refreshCSRFToken } = await import('../lib/axios');
        await refreshCSRFToken(true); 

        const api = (await import('../lib/axios')).default;
        const retryResponse = await api.get('/api/user');
        return retryResponse.data;
      } catch (retryError) {
        console.error("Error en reintento de fetchUser:", retryError);
        return null;
      }
    }

    console.warn("Error no crítico al obtener usuario:", error.message);
    return null;
  }
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading, refetch } = useQuery({
    queryKey: ['/api/user'],
    queryFn: fetchUser,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const loginMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; rememberMe?: boolean }) => {
      const isLoginInProgress = sessionStorage.getItem('loginInProgress') === 'true';

      if (isLoginInProgress) {
        console.log("Detectada solicitud de login duplicada, esperando...");
        await new Promise(resolve => setTimeout(resolve, 500));

        const currentUser = queryClient.getQueryData(['/api/user']);
        if (currentUser) {
          console.log("Usuario ya autenticado, evitando solicitud duplicada");
          return currentUser;
        }
      }

      sessionStorage.setItem('loginInProgress', 'true');

      try {
        console.log("Iniciando sesión con:", { username: userData.username, rememberMe: userData.rememberMe });

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        async function attemptLogin(forceNewToken = false, retryCount = 0) {
          try {
            if (retryCount > 0) {
              await delay(retryCount * 300);
            }

            const { refreshCSRFToken } = await import('../lib/axios');
            const api = (await import('../lib/axios')).default;

            await refreshCSRFToken(forceNewToken);
            console.log("CSRF Token actualizado correctamente");

            const csrfToken = localStorage.getItem('csrfToken');

            const timestamp = new Date().getTime();

            const dataWithCSRF = {
              ...userData,
              csrfToken: csrfToken,
              _timestamp: timestamp
            };

            const config = {
              headers: {
                'X-CSRF-Token': csrfToken,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              },
              withCredentials: true
            };

            const response = await api.post('/api/login', dataWithCSRF, config);

            if (response.data?.user?.id) {
              try {
                const sessionResponse = await api.post('/api/sessions/start', {
                  userId: response.data.user.id
                });

                if (sessionResponse.data?.id) {
                  localStorage.setItem('currentSession', sessionResponse.data.id.toString());

                  const trackActivity = setInterval(() => {
                    api.post(`/api/sessions/${sessionResponse.data.id}/update-activity`)
                      .catch(console.error);
                  }, 60000); 

                  localStorage.setItem('activityTracker', trackActivity.toString());
                }
              } catch (error) {
                console.error("Error starting session:", error);
              }
            }

            return response.data;
          } catch (error) {
            throw error;
          }
        }

        try {
          return await attemptLogin(false, 0);
        } catch (error: any) {
          console.error("Error en primer intento de inicio de sesión:", error);

          try {
            console.log("Reintentando login con token forzado...");
            await delay(500); 
            return await attemptLogin(true, 1);
          } catch (retryError: any) {
            console.error("Error en segundo intento de inicio de sesión:", retryError);

            try {
              console.log("Realizando intento final de login...");
              await delay(1000); 
              return await attemptLogin(true, 2);
            } catch (finalError: any) {
              console.error("Error en intento final de inicio de sesión:", finalError);

              if (finalError.response?.status === 401) {
                throw new Error("Nombre de usuario o contraseña incorrectos");
              } else if (finalError.response?.data?.message) {
                throw new Error(finalError.response.data.message);
              } else {
                throw new Error("Error al iniciar sesión. Intente de nuevo.");
              }
            }
          }
        }
      } finally {
        sessionStorage.removeItem('loginInProgress');
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const currentSession = localStorage.getItem('currentSession');
        if (currentSession) {
          try {
            await api.post(`/api/sessions/${currentSession}/end`);
          } catch (error) {
            console.error("Error ending session:", error);
          }
        }

        const trackerId = localStorage.getItem('activityTracker');
        if (trackerId) {
          clearInterval(parseInt(trackerId));
          localStorage.removeItem('activityTracker');
        }

        localStorage.removeItem('currentSession');

        const response = await api.post('/api/logout');
        return response.data;
      } catch (error: any) {
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Sesión cerrada correctamente");
      queryClient.setQueryData(['/api/user'], null);
      window.location.href = "/";
    },
  });


  return {
    user,
    error,
    isLoading,
    refetch,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync
  };
}
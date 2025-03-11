
import { User, ProjectAccess } from "@db/schema";
import { useQuery, QueryObserverResult, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ApiUser = User & {
  projectAccess: ProjectAccess[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export function useUsers(): {
  users: ApiUser[];
  isLoading: boolean;
  refetch: () => Promise<QueryObserverResult<ApiResponse<ApiUser[]>>>;
  deleteUser: (userId: number) => Promise<void>;
  createUser: (user: User) => Promise<void>;
  updateUser: ({userId, user}: { userId: number; user: Partial<User>}) => Promise<void>;
} {
  
  const queryClient = useQueryClient();
  const queryKey = ["/api/users"];

  const { data: response, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      // Usamos axios para la consulta que se beneficia del manejo de credenciales
      const api = (await import('../lib/axios')).default;
      try {
        const response = await api.get(queryKey[0]);
        return response.data as ApiResponse<ApiUser[]>;
      } catch (error: any) {
        console.error("Error fetching users:", error);
        throw new Error(error.response?.data?.message || "Error al cargar los usuarios");
      }
    },
    retry: 1,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000, // Datos considerados frescos por 10 segundos
    gcTime: 30 * 60 * 1000 // Tiempo de recolección de basura (antes cacheTime)
  });

  const createUserMutation = useMutation({
    mutationFn: async (user: User) => {
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.post(queryKey[0], user);
        return response.data;
      } catch (error: any) {
        console.error("Error creating user:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        // Obtener mensaje de error de la respuesta
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        
        // Otros errores
        throw new Error(error.message || "Error al crear el usuario");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Usuario creado", {
        description: "El usuario se ha creado correctamente",
      });
    },
    onError: (error: Error) => {
      // Si es un error de CSRF, mostramos un mensaje más amigable
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.message || "No se pudo crear el usuario",
        });
      }
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, user }: { userId: number; user: Partial<User> }) => {
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.put(`/api/users/${userId}`, user);
        return response.data;
      } catch (error: any) {
        console.error("Error updating user:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        // Obtener mensaje de error de la respuesta
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        
        // Otros errores
        throw new Error(error.message || "Error al actualizar el usuario");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Usuario actualizado", {
        description: "El usuario se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      // Si es un error de CSRF, mostramos un mensaje más amigable
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.message || "No se pudo actualizar el usuario",
        });
      }
    },
  })
    
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.delete(`/api/users/${userId}`);
        return response.data;
      } catch (error: any) {
        console.error("Error deleting user:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        // Obtener mensaje de error de la respuesta
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        
        // Otros errores
        throw new Error(error.message || "Error al eliminar el usuario");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Usuario eliminado", {
        description: "El usuario ha sido eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      // Si es un error de CSRF, mostramos un mensaje más amigable
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.message || "No se pudo eliminar el usuario",
        });
      }
    },
  });

  return {
    isLoading,
    users: response?.data ?? [],
    refetch,
    deleteUser: deleteUserMutation.mutateAsync,
    createUser: createUserMutation.mutateAsync,
    updateUser: updateUserMutation.mutateAsync,
  };
}

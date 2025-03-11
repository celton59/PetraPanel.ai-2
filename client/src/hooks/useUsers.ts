
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
      const res = await fetch(queryKey[0], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.message ?? "Error al crear el usuario");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Usuario creado", {
        description: "El usuario se ha creado correctamente",
      });
    },
    onError: (error: Error) => {
      toast("Error", {
        description: error.message || "No se pudo crear el usuario",
      });
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, user }: { userId: number; user: Partial<User> }) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      if (!res.ok) {
        throw new Error("Error al actualizar el usuario");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Usuario actualizado", {
        description: "El usuario se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      toast("Error", {
        description: error.message || "No se pudo actualizar el usuario",
      });
    },
  })
    
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Error al eliminar el usuario");
      }
    
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Video eliminado", {
        description: "El video se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast("Error", {
        description: error.message || "No se pudo eliminar el video",
      });
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

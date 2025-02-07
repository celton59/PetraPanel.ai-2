
import { User, ProjectAccess } from "@db/schema";
import { useQuery, QueryObserverResult } from "@tanstack/react-query";

type UserWithProjects = User & {
  projectAccess: ProjectAccess[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export function useUsers(): {
  users: UserWithProjects[];
  isLoading: boolean;
  refetch: () => Promise<QueryObserverResult<ApiResponse<UserWithProjects[]>>>;
} {
  const queryKey = ["/api/users"];

  const { data: response, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(queryKey[0], {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Error al cargar los usuarios");
      }
      return res.json() as Promise<ApiResponse<UserWithProjects[]>>;
    },
    retry: 1,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000, // Datos considerados frescos por 10 segundos
    gcTime: 30 * 60 * 1000 // Tiempo de recolección de basura (antes cacheTime)
  });

  return {
    isLoading,
    users: response?.data ?? [],
    refetch
  };
}

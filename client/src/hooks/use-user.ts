import { useQuery } from "@tanstack/react-query";
import { User } from "@/types/user";

interface UseUserResponse {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<User | null>;
}

export function useUser(): UseUserResponse {
  const { data, isLoading, error, refetch } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await fetch('/api/user');
      if (!response.ok) {
        if (response.status === 401) {
          // No autenticado, retornar null en vez de error
          return null as unknown as User;
        }
        throw new Error('Error al obtener el usuario');
      }
      return response.json();
    },
    retry: false,
  });

  return {
    user: data || null,
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      const result = await refetch();
      return result.data || null;
    },
  };
}

import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@/types/user";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const useUsers = () => {
  return useQuery<Profile[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Error fetching users");
      }
      const result: ApiResponse<Profile[]> = await response.json();
      return result.data;
    },
    refetchInterval: 30000, // Refresca cada 30 segundos
    refetchInBackground: true,
    staleTime: 10000 // Considera los datos frescos por 10 segundos
  });
};


import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types/project";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const useProjects = () => {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch("/api/projects", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Error fetching projects");
      }
      const result: ApiResponse<Project[]> = await response.json();
      return result.data;
    },
    refetchInterval: 30000, // Refresca cada 30 segundos
    refetchInBackground: true,
    staleTime: 10000 // Considera los datos frescos por 10 segundos
  });
};

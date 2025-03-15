import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "./use-user";

export interface VideoLimitsData {
  canTakeMore: boolean;
  currentCount: number;
  maxAllowed: number;
}

interface ApiResponse {
  success: boolean;
  data: VideoLimitsData;
}

/**
 * Hook para obtener y gestionar los límites de videos asignados a un usuario youtuber
 * @returns Datos relacionados con los límites de videos asignados
 */
export const useVideoLimits = () => {
  const { user } = useUser();
  
  const { data, isLoading, error, refetch } = useQuery<ApiResponse>({
    queryKey: ["video-limits"],
    queryFn: async () => {
      const response = await axios.get("/api/youtuber/video-limits");
      return response.data;
    },
    enabled: !!user && user.role === "youtuber",
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Valores predeterminados en caso de no tener datos
  const videoLimits: VideoLimitsData = data?.success ? data.data : {
    canTakeMore: true,
    currentCount: 0,
    maxAllowed: 30
  };

  // Calcular el porcentaje de uso para la barra de progreso
  const usagePercentage = videoLimits 
    ? Math.min(Math.round((videoLimits.currentCount / videoLimits.maxAllowed) * 100), 100)
    : 0;

  // Determinar si está cerca del límite (>75%)
  const isNearLimit = usagePercentage > 75;
  
  // Determinar si ha alcanzado el límite
  const isAtLimit = !videoLimits.canTakeMore;

  return {
    videoLimits,
    isLoading,
    error,
    refetch,
    usagePercentage,
    isNearLimit,
    isAtLimit
  };
};
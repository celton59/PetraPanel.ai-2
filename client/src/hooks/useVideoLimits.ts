import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "./use-user";

export interface VideoLimitsData {
  // Límites de asignación concurrente
  canTakeMore: boolean;
  currentCount: number;
  maxAllowed: number;
  
  // Límites mensuales
  monthlyLimit: number;
  currentMonthCount: number;
  reachedMonthlyLimit: boolean;
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
    // Valores predeterminados para límites concurrentes
    canTakeMore: true,
    currentCount: 0,
    maxAllowed: 10,
    
    // Valores predeterminados para límites mensuales
    monthlyLimit: 50,
    currentMonthCount: 0,
    reachedMonthlyLimit: false
  };

  // Calcular el porcentaje de uso concurrente para la barra de progreso
  const usagePercentage = videoLimits 
    ? Math.min(Math.round((videoLimits.currentCount / videoLimits.maxAllowed) * 100), 100)
    : 0;

  // Calcular el porcentaje de uso mensual para la barra de progreso
  const monthlyUsagePercentage = videoLimits 
    ? Math.min(Math.round((videoLimits.currentMonthCount / videoLimits.monthlyLimit) * 100), 100)
    : 0;

  // Determinar si está cerca del límite concurrente (>75%)
  const isNearLimit = usagePercentage > 75;
  
  // Determinar si está cerca del límite mensual (>75%)
  const isNearMonthlyLimit = monthlyUsagePercentage > 75;
  
  // Determinar si ha alcanzado el límite de asignación concurrente
  const isAtLimit = !videoLimits.canTakeMore;
  
  // Determinar si ha alcanzado el límite mensual
  const isAtMonthlyLimit = videoLimits.reachedMonthlyLimit;

  return {
    videoLimits,
    isLoading,
    error,
    refetch,
    // Información de límites concurrentes
    usagePercentage,
    isNearLimit,
    isAtLimit,
    // Información de límites mensuales
    monthlyUsagePercentage,
    isNearMonthlyLimit,
    isAtMonthlyLimit
  };
};
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "./use-user";

export interface VideoLimitsData {
  // Límites de asignación concurrente
  canTakeMore: boolean;
  currentAssignedCount: number;
  maxAssignedAllowed: number;

  // Límites mensuales
  monthlyLimit: number;
  currentMonthlyCount: number;
  reachedMonthlyLimit: boolean;

  // Nuevos campos para límites mensuales específicos
  specificMonthlyLimit?: boolean;
  monthlyLimits?: Array<{
    year: number;
    month: number;
    maxVideos: number;
  }>;
}

/**
 * Hook para obtener y gestionar los límites de videos asignados a un usuario youtuber
 * @returns Datos relacionados con los límites de videos asignados
 */
export const useVideoLimits = (userId?: number) => {
  const { user } = useUser();

  // Query principal para límites de videos
  const { data, isLoading, error, refetch } = useQuery<VideoLimitsData>({
    queryKey: ["video-limits", userId],
    queryFn: async () => {
      const url = userId ? `/api/youtuber/video-limits?userId=${userId}` : "/api/youtuber/video-limits";
      const response = await axios.get(url);
      return response.data;
    },
    enabled: !!user && (user.role === "youtuber" || user.role === "admin"),
    staleTime: 30 * 1000, // 30 segundos
  });

  // Query separada para límites mensuales
  const { data: monthlyLimitsData } = useQuery({
    queryKey: ["monthly-limits", userId],
    queryFn: async () => {
      const response = await axios.get(`/api/youtuber/monthly-limits/${userId}`);
      return response.data;
    },
    enabled: !!userId && !!user && (user.role === "youtuber" || user.role === "admin"),
    staleTime: 30 * 1000, // 30 segundos
  });

  // Valores predeterminados en caso de no tener datos
  const videoLimits: VideoLimitsData = data || {
    canTakeMore: true,
    currentAssignedCount: 0,
    maxAssignedAllowed: 10,
    monthlyLimit: 50,
    currentMonthlyCount: 0,
    reachedMonthlyLimit: false,
    monthlyLimits: monthlyLimitsData?.data || []
  };

  // Calcular el porcentaje de uso concurrente para la barra de progreso
  const usagePercentage = videoLimits 
    ? Math.min(Math.round((videoLimits.currentAssignedCount / videoLimits.maxAssignedAllowed) * 100), 100)
    : 0;

  // Calcular el porcentaje de uso mensual para la barra de progreso
  const monthlyUsagePercentage = videoLimits 
    ? Math.min(Math.round((videoLimits.currentMonthlyCount / videoLimits.monthlyLimit) * 100), 100)
    : 0;

  // Determinar si está cerca del límite concurrente (>75%)
  const isNearLimit = usagePercentage > 75;

  // Determinar si está cerca del límite mensual (>75%)
  const isNearMonthlyLimit = monthlyUsagePercentage > 75;

  // Determinar si ha alcanzado el límite de asignación concurrente
  const isAtLimit = !videoLimits.canTakeMore;

  // Determinar si ha alcanzado el límite mensual
  const isAtMonthlyLimit = videoLimits.reachedMonthlyLimit;

  // Nueva función para establecer un límite mensual específico
  const setMonthlyLimit = async (params: {
    userId: number;
    maxVideos: number;
    year?: number;
    month?: number;
  }) => {
    try {
      const response = await axios.post('/api/youtuber/monthly-limit', params);
      await refetch(); // Refrescar datos después de establecer el límite
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error al establecer límite mensual:', error);
      return {
        success: false,
        message: error?.response?.data?.message || 'Error al establecer límite mensual'
      };
    }
  };

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
    isAtMonthlyLimit,
    // Función para gestionar límites mensuales específicos
    setMonthlyLimit,
  };
};
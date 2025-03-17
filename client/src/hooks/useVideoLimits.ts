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
  
  const { data, isLoading, error, refetch } = useQuery<VideoLimitsData>({
    queryKey: ["video-limits", userId],
    queryFn: async () => {
      const url = userId ? `/api/youtuber/video-limits?userId=${userId}` : "/api/youtuber/video-limits";
      const response = await axios.get(url);
      return response.data;
    },
    enabled: !!user && (user.role === "youtuber" || user.role === "admin"),
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Valores predeterminados en caso de no tener datos
  const videoLimits: VideoLimitsData = data || {
    // Valores predeterminados para límites concurrentes
    canTakeMore: true,
    currentAssignedCount: 0,
    maxAssignedAllowed: 10,
    
    // Valores predeterminados para límites mensuales
    monthlyLimit: 50,
    currentMonthlyCount: 0,
    reachedMonthlyLimit: false
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

  // Cache para los límites mensuales específicos
  const monthlyLimitsCache = new Map<number, { data: any[], timestamp: number }>();
  
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
      
      // Invalidar la caché para este usuario
      monthlyLimitsCache.delete(params.userId);
      
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
  
  // Función para obtener todos los límites mensuales específicos de un usuario
  // Con caché para reducir peticiones a la API
  const getAllMonthlyLimits = async (userId: number) => {
    try {
      // Verificar caché para reducir llamadas a la API
      const cachedData = monthlyLimitsCache.get(userId);
      const now = Date.now();
      
      // Usar caché si existe y tiene menos de 30 segundos
      if (cachedData && (now - cachedData.timestamp < 30000)) {
        console.log('Usando caché para límites mensuales');
        return {
          success: true,
          data: cachedData.data
        };
      }
      
      const response = await axios.get(`/api/youtuber/monthly-limits/${userId}`);
      
      // Guardar en caché
      monthlyLimitsCache.set(userId, {
        data: response.data.data,
        timestamp: now
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Error al obtener límites mensuales:', error);
      return {
        success: false,
        message: error?.response?.data?.message || 'Error al obtener límites mensuales',
        data: []
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
    // Nuevas funciones para gestionar límites mensuales específicos
    setMonthlyLimit,
    getAllMonthlyLimits
  };
};
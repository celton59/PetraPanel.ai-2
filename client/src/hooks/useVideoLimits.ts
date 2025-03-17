import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useUser } from "./use-user";

export interface VideoLimitsData {
  canTakeMore: boolean;
  currentAssignedCount: number;
  maxAssignedAllowed: number;
  monthlyLimit: number;
  currentMonthlyCount: number;
  reachedMonthlyLimit: boolean;
  specificMonthlyLimit?: boolean;
  monthlyLimits?: Array<{
    year: number;
    month: number;
    maxVideos: number;
    isProrated: boolean;
    overrideReason?: string;
  }>;
}

interface SetMonthlyLimitParams {
  userId: number;
  maxVideos: number;
  year?: number;
  month?: number;
  isProrated?: boolean;
  overrideReason?: string;
  startDate?: Date;
}

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
  });

  const videoLimits: VideoLimitsData = data || {
    canTakeMore: true,
    currentAssignedCount: 0,
    maxAssignedAllowed: 10,
    monthlyLimit: 50,
    currentMonthlyCount: 0,
    reachedMonthlyLimit: false
  };

  const setMonthlyLimit = async (params: SetMonthlyLimitParams) => {
    try {
      const response = await axios.post('/api/youtuber/monthly-limit', params);
      await refetch();
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

  const getAllMonthlyLimits = async (userId: number) => {
    try {
      const response = await axios.get(`/api/youtuber/monthly-limits/${userId}`);
      return {
        success: true,
        data: response.data
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
    setMonthlyLimit,
    getAllMonthlyLimits,
    usagePercentage: Math.min(Math.round((videoLimits.currentAssignedCount / videoLimits.maxAssignedAllowed) * 100), 100),
    monthlyUsagePercentage: Math.min(Math.round((videoLimits.currentMonthlyCount / videoLimits.monthlyLimit) * 100), 100),
    isNearLimit: videoLimits.currentAssignedCount > (videoLimits.maxAssignedAllowed * 0.75),
    isNearMonthlyLimit: videoLimits.currentMonthlyCount > (videoLimits.monthlyLimit * 0.75),
    isAtLimit: !videoLimits.canTakeMore,
    isAtMonthlyLimit: videoLimits.reachedMonthlyLimit
  };
};
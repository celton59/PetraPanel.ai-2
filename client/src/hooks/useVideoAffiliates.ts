import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

interface VideoAffiliate {
  id: number;
  videoId: number;
  companyId: number;
  companyName: string;
  isIncluded: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Hook para gestionar los afiliados detectados en un video
 * @param videoId ID del video
 */
export function useVideoAffiliates(videoId: number | null) {
  const queryClient = useQueryClient();
  
  const getAffiliates = async (): Promise<VideoAffiliate[]> => {
    if (!videoId) return [];
    
    const response = await axios.get(`/api/affiliates/videos/${videoId}/matches`);
    return response.data.data || [];
  };
  
  const { data: affiliates = [], isLoading, error } = useQuery({
    queryKey: ['videoAffiliates', videoId],
    queryFn: getAffiliates,
    enabled: !!videoId,
  });
  
  // Mutación para actualizar el estado de inclusión de un enlace de afiliado
  const updateAffiliateMutation = useMutation({
    mutationFn: async ({ affiliateId, isIncluded }: { affiliateId: number; isIncluded: boolean }) => {
      const response = await axios.post(`/api/affiliates/matches/${affiliateId}`, {
        isIncluded
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidar la consulta para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['videoAffiliates', videoId] });
    }
  });
  
  const updateAffiliateStatus = (affiliateId: number, isIncluded: boolean) => {
    return updateAffiliateMutation.mutate({ affiliateId, isIncluded });
  };
  
  // Conteo rápido para UI
  const pendingAffiliates = affiliates.filter(a => !a.isIncluded).length;
  const hasAffiliates = affiliates.length > 0;
  
  return {
    affiliates,
    isLoading,
    error,
    updateAffiliateStatus,
    pendingAffiliates,
    hasAffiliates
  };
}
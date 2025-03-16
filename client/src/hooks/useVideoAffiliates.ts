import { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AffiliateCompany {
  id: number;
  name: string;
  website: string;
  logo_url: string | null;
  is_active: boolean;
}

interface VideoAffiliate {
  id: number;
  video_id: number;
  company_id: number;
  company?: AffiliateCompany;
  included_by_youtuber: boolean;
  isIncluded: boolean; // Alias para una API más amigable
  created_at: string;
  updated_at: string;
}

/**
 * Hook para gestionar los enlaces de afiliados de un video
 * @param videoId ID del video
 */
export function useVideoAffiliates(videoId: number) {
  const queryClient = useQueryClient();
  
  // Obtener los afiliados detectados para el video
  const { 
    data: affiliates = [],
    isLoading,
    isError,
    error
  } = useQuery<VideoAffiliate[]>({
    queryKey: ['video-affiliates', videoId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/affiliates/videos/${videoId}/matches`);
        const data = response.data.data || [];
        
        // Transformar los datos para una API más amigable
        return data.map((affiliate: any) => ({
          ...affiliate,
          isIncluded: affiliate.included_by_youtuber
        }));
      } catch (error) {
        console.error('Error al cargar afiliados:', error);
        return [];
      }
    },
    enabled: !!videoId
  });

  // Mutación para actualizar la inclusión de un afiliado
  const updateAffiliateMutation = useMutation({
    mutationFn: async ({ 
      affiliateId, 
      included 
    }: { 
      affiliateId: number; 
      included: boolean 
    }) => {
      const response = await axios.post(`/api/affiliates/matches/${affiliateId}/inclusion`, {
        included
      });
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar la consulta para recargar los datos
      queryClient.invalidateQueries({ queryKey: ['video-affiliates', videoId] });
    }
  });

  // Función para actualizar el estado de inclusión
  const updateAffiliateInclusion = async (affiliateId: number, included: boolean) => {
    return updateAffiliateMutation.mutateAsync({ affiliateId, included });
  };

  return {
    affiliates,
    isLoading,
    isError,
    error,
    updateAffiliateInclusion,
    isUpdating: updateAffiliateMutation.isPending
  };
}
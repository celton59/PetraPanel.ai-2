import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface VideoAffiliate {
  id: number;
  videoId: number;
  companyId: number;
  companyName: string;
  companyLogo?: string | null;
  companyUrl?: string | null;
  includedByYoutuber: boolean;
  notified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Clave base para la caché de consultas
const AFFILIATES_QUERY_KEY = 'videoAffiliates';

/**
 * Transforma los datos de afiliados desde la API al formato que necesitamos
 */
const transformAffiliateData = (affiliateData: any[]): VideoAffiliate[] => {
  return affiliateData.map((affiliate: any) => ({
    id: affiliate.id,
    videoId: affiliate.video_id,
    companyId: affiliate.company_id,
    companyName: affiliate.company?.name || 'Desconocido',
    companyLogo: affiliate.company?.logo_url,
    companyUrl: affiliate.company?.affiliate_url,
    includedByYoutuber: affiliate.included_by_youtuber || false,
    notified: affiliate.notified || false,
    createdAt: affiliate.created_at,
    updatedAt: affiliate.updated_at
  }));
};

/**
 * Función para obtener afiliados desde el servidor
 */
const fetchVideoAffiliates = async (videoId: number): Promise<VideoAffiliate[]> => {
  if (!videoId) return [];
  
  const response = await axios.get(`/api/affiliates/videos/${videoId}/matches`);
  const affiliateData = response.data.data || [];
  
  return transformAffiliateData(affiliateData);
};

/**
 * Hook para gestionar los datos de afiliados de un video específico
 * Utiliza react-query para caché y gestión de estado
 * @param videoId ID del video
 * @returns Estado y funciones para gestionar afiliados
 */
export function useVideoAffiliates(videoId: number | undefined) {
  const queryClient = useQueryClient();
  
  // Consulta con caché para obtener afiliados
  const { 
    data: affiliates = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [AFFILIATES_QUERY_KEY, videoId],
    queryFn: () => videoId ? fetchVideoAffiliates(videoId) : Promise.resolve([]),
    enabled: !!videoId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutación para actualizar el estado de inclusión de un afiliado
  const updateAffiliateMutation = useMutation({
    mutationFn: async ({ affiliateId, isIncluded }: { affiliateId: number, isIncluded: boolean }) => {
      const response = await axios.put(`/api/affiliates/matches/${affiliateId}/inclusion`, {
        included: isIncluded
      });
      return { success: response.data.success, affiliateId, isIncluded };
    },
    onSuccess: (data) => {
      if (data.success && videoId) {
        // Actualizar la caché con el nuevo estado
        queryClient.setQueryData([AFFILIATES_QUERY_KEY, videoId], (oldData: VideoAffiliate[] | undefined) => {
          if (!oldData) return [];
          
          return oldData.map(affiliate => 
            affiliate.id === data.affiliateId 
              ? { ...affiliate, includedByYoutuber: data.isIncluded } 
              : affiliate
          );
        });
        
        toast.success(`Enlace de afiliado ${data.isIncluded ? 'marcado como incluido' : 'marcado como no incluido'}`);
      }
    },
    onError: (error) => {
      console.error('Error al actualizar estado de afiliado:', error);
      toast.error('No se pudo actualizar el estado del afiliado');
    }
  });

  // Función para actualizar el estado de inclusión de un afiliado
  const updateAffiliateStatus = useCallback((affiliateId: number, isIncluded: boolean) => {
    updateAffiliateMutation.mutate({ affiliateId, isIncluded });
  }, [updateAffiliateMutation]);

  // Calcular número de afiliados pendientes (que no han sido incluidos)
  const pendingAffiliates = affiliates.filter(affiliate => !affiliate.includedByYoutuber).length;

  // Verificar si hay algún afiliado
  const hasAffiliates = affiliates.length > 0;

  return {
    affiliates,
    isLoading,
    error,
    isUpdating: updateAffiliateMutation.isLoading,
    updateAffiliateStatus,
    pendingAffiliates,
    hasAffiliates
  };
}
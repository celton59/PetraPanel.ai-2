import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

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

/**
 * Hook para gestionar los datos de afiliados de un video específico
 * @param videoId ID del video
 * @returns Estado y funciones para gestionar afiliados
 */
export function useVideoAffiliates(videoId: number | undefined) {
  const [affiliates, setAffiliates] = useState<VideoAffiliate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Obtener afiliados al montar el componente o cuando cambia el videoId
  useEffect(() => {
    if (videoId) {
      fetchAffiliates();
    }
  }, [videoId]);

  // Función para obtener afiliados desde el servidor
  const fetchAffiliates = async () => {
    if (!videoId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/affiliates/videos/${videoId}/matches`);
      const affiliateData = response.data.data || [];
      
      // Transformar los datos al formato que esperamos
      const formattedAffiliates = affiliateData.map((affiliate: any) => ({
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
      
      setAffiliates(formattedAffiliates);
    } catch (error) {
      console.error('Error al cargar afiliados:', error);
      setError(error instanceof Error ? error : new Error('Error desconocido al cargar afiliados'));
      setAffiliates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar el estado de inclusión de un afiliado
  const updateAffiliateStatus = async (affiliateId: number, isIncluded: boolean) => {
    setIsUpdating(true);
    
    try {
      const response = await axios.put(`/api/affiliates/matches/${affiliateId}/inclusion`, {
        included: isIncluded
      });
      
      if (response.data.success) {
        // Actualizar el estado localmente
        setAffiliates(prevAffiliates => 
          prevAffiliates.map(affiliate => 
            affiliate.id === affiliateId 
              ? { ...affiliate, includedByYoutuber: isIncluded } 
              : affiliate
          )
        );
        
        toast.success(`Enlace de afiliado ${isIncluded ? 'marcado como incluido' : 'marcado como no incluido'}`);
      } else {
        throw new Error('Error al actualizar el estado del afiliado');
      }
    } catch (error) {
      console.error('Error al actualizar estado de afiliado:', error);
      toast.error('No se pudo actualizar el estado del afiliado');
      setError(error instanceof Error ? error : new Error('Error desconocido al actualizar afiliado'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Calcular número de afiliados pendientes (que no han sido incluidos)
  const pendingAffiliates = affiliates.filter(affiliate => !affiliate.includedByYoutuber).length;

  // Verificar si hay algún afiliado
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
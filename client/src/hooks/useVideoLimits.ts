import { useQuery } from '@tanstack/react-query';
import axios from '../lib/axios';

export interface VideoLimits {
  canTakeMore: boolean;
  currentCount: number;
  maxAllowed: number;
}

/**
 * Hook para obtener información sobre los límites de videos asignados al youtuber
 * @returns Objeto con límites de videos, estado de carga y error
 */
export function useVideoLimits() {
  return useQuery<VideoLimits>({
    queryKey: ['/api/youtuber/video-limits'],
    queryFn: async () => {
      const response = await axios.get('/api/youtuber/video-limits');
      return response.data.data;
    },
    // Solo intentar obtener datos si hay un usuario autenticado
    enabled: true,
    // No actualizar automáticamente
    refetchOnWindowFocus: false,
    // Cachear los resultados por 5 minutos
    staleTime: 1000 * 60 * 5,
    // En caso de error, no hacer retry automático
    retry: false,
  });
}
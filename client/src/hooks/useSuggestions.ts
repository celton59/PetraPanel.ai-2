import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from './use-toast';

// Definición del tipo Suggestion
export interface Suggestion {
  id: number;
  userId: number;
  userName?: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'reviewed' | 'implemented' | 'rejected';
  adminNotes?: string;
  created_at: string;
  updated_at: string;
}

// Tipo para los filtros de sugerencias (para administradores)
interface SuggestionFilters {
  status: string;
  category: string;
  search: string;
}

// Tipo para los datos de actualización de estado
interface UpdateStatusData {
  id: number;
  data: {
    status: string;
    adminNotes?: string;
  };
}

// Hook para gestionar las sugerencias
export function useSuggestions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SuggestionFilters>({
    status: '',
    category: '',
    search: '',
  });

  // Obtener las sugerencias del usuario actual
  const userSuggestions = useQuery({
    queryKey: ['suggestions', 'user'],
    queryFn: async () => {
      try {
        const { data } = await axios.get<Suggestion[]>('/api/suggestions/user');
        return data;
      } catch (error) {
        console.error('Error al obtener las sugerencias del usuario:', error);
        throw error;
      }
    },
  });

  // Obtener todas las sugerencias (para administradores)
  const allSuggestions = useQuery({
    queryKey: ['suggestions', 'all', filters],
    queryFn: async () => {
      try {
        const { status, category, search } = filters;
        const params = new URLSearchParams();
        
        if (status) params.append('status', status);
        if (category) params.append('category', category);
        if (search) params.append('search', search);

        const url = `/api/suggestions${params.toString() ? `?${params.toString()}` : ''}`;
        const { data } = await axios.get<Suggestion[]>(url);
        return data;
      } catch (error) {
        console.error('Error al obtener todas las sugerencias:', error);
        throw error;
      }
    },
  });

  // Obtener categorías disponibles
  const categories = useQuery({
    queryKey: ['suggestions', 'categories'],
    queryFn: async () => {
      try {
        const { data } = await axios.get<string[]>('/api/suggestions/categories');
        return data;
      } catch (error) {
        console.error('Error al obtener categorías:', error);
        throw error;
      }
    },
  });

  // Crear una nueva sugerencia
  const createSuggestion = useMutation({
    mutationFn: async (suggestion: { title: string; description: string; category: string }) => {
      try {
        const { data } = await axios.post<Suggestion>('/api/suggestions', suggestion);
        return data;
      } catch (error) {
        console.error('Error al crear sugerencia:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar consultas para actualizar las listas
      queryClient.invalidateQueries({
        queryKey: ['suggestions', 'user'],
      });
      
      toast({
        title: '¡Sugerencia enviada!',
        description: 'Tu sugerencia ha sido enviada correctamente. Gracias por ayudarnos a mejorar.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error al enviar sugerencia',
        description: error.response?.data?.message || 'Ha ocurrido un error al enviar tu sugerencia.',
        variant: 'destructive',
      });
    },
  });

  // Actualizar el estado de una sugerencia (para administradores)
  const updateSuggestionStatus = useMutation({
    mutationFn: async ({ id, data }: UpdateStatusData) => {
      try {
        const response = await axios.patch<Suggestion>(`/api/suggestions/${id}/status`, data);
        return response.data;
      } catch (error) {
        console.error('Error al actualizar estado:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar consultas para actualizar las listas
      queryClient.invalidateQueries({
        queryKey: ['suggestions'],
      });
      
      toast({
        title: 'Estado actualizado',
        description: 'El estado de la sugerencia ha sido actualizado correctamente.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error al actualizar estado',
        description: error.response?.data?.message || 'Ha ocurrido un error al actualizar el estado.',
        variant: 'destructive',
      });
    },
  });

  return {
    // Consultas
    userSuggestions,
    allSuggestions,
    categories,
    
    // Mutaciones
    createSuggestion,
    updateSuggestionStatus,
    
    // Estado de filtros
    filters,
    setFilters,
  };
}
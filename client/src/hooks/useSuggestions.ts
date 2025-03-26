import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

export interface Suggestion {
  id: number;
  userId: number;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'reviewed' | 'implemented' | 'rejected';
  adminNotes?: string;
  created_at: string;
  updated_at: string;
  userName?: string;
}

export interface SuggestionFormData {
  title: string;
  description: string;
  category: string;
}

export function useSuggestions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
  });

  // Obtener las sugerencias del usuario actual
  const userSuggestions = useQuery({
    queryKey: ['suggestions', 'user'],
    queryFn: async () => {
      const { data } = await axios.get<Suggestion[]>('/api/suggestions/user');
      return data;
    },
    onError: (error) => {
      console.error('Error al obtener sugerencias:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar tus sugerencias. Intenta de nuevo más tarde.',
        variant: 'destructive',
      });
    },
  });

  // Obtener todas las sugerencias (para administradores)
  const allSuggestions = useQuery({
    queryKey: ['suggestions', 'all', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const { data } = await axios.get<Suggestion[]>(`/api/suggestions?${params.toString()}`);
      return data;
    },
    onError: (error) => {
      console.error('Error al obtener todas las sugerencias:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las sugerencias. Intenta de nuevo más tarde.',
        variant: 'destructive',
      });
    },
  });

  // Obtener categorías disponibles
  const categories = useQuery({
    queryKey: ['suggestions', 'categories'],
    queryFn: async () => {
      const { data } = await axios.get<string[]>('/api/suggestions/categories');
      return data;
    },
    onError: (error) => {
      console.error('Error al obtener categorías:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías. Usando valores predeterminados.',
        variant: 'destructive',
      });
      return ['general', 'interfaz', 'funcionalidad', 'rendimiento', 'bug', 'optimización'];
    },
  });

  // Crear una nueva sugerencia
  const createSuggestion = useMutation({
    mutationFn: async (data: SuggestionFormData) => {
      const response = await axios.post<Suggestion>('/api/suggestions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', 'user'] });
      toast({
        title: 'Sugerencia enviada',
        description: 'Tu sugerencia ha sido enviada correctamente. ¡Gracias por ayudarnos a mejorar!',
      });
    },
    onError: (error) => {
      console.error('Error al crear sugerencia:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la sugerencia. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    },
  });

  // Actualizar estado de una sugerencia (solo para administradores)
  const updateSuggestionStatus = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { status: string; adminNotes?: string } }) => {
      const response = await axios.patch<Suggestion>(`/api/suggestions/${id}/status`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', 'all'] });
      toast({
        title: 'Estado actualizado',
        description: 'El estado de la sugerencia ha sido actualizado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error al actualizar estado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la sugerencia. Intenta de nuevo.',
        variant: 'destructive',
      });
    },
  });

  return {
    userSuggestions,
    allSuggestions,
    categories,
    createSuggestion,
    updateSuggestionStatus,
    filters,
    setFilters,
  };
}
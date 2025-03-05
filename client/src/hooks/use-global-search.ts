import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Definir los tipos para los resultados de búsqueda
export type SearchItemType = 'video' | 'project' | 'user' | 'channel' | 'settings';

export interface SearchItem {
  id: string | number;
  title: string;
  subtitle?: string;
  type: SearchItemType;
  url: string;
  icon?: string;
  thumbnail?: string;
  date?: Date | string;
  tags?: string[];
  status?: string;
}

// Interfaz para el historial de búsqueda
interface SearchHistory {
  query: string;
  timestamp: number;
}

// Estado de la búsqueda global
interface GlobalSearchState {
  isOpen: boolean;
  query: string;
  searchHistory: SearchHistory[];
  recentlyVisited: SearchItem[];
  
  // Acciones
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  addToRecentlyVisited: (item: SearchItem) => void;
  removeFromRecentlyVisited: (itemId: string | number) => void;
}

// Crear el store de Zustand
export const useGlobalSearchStore = create<GlobalSearchState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      query: '',
      searchHistory: [],
      recentlyVisited: [],
      
      setOpen: (open) => set({ isOpen: open }),
      
      setQuery: (query) => set({ query }),
      
      addToHistory: (query) => {
        if (!query.trim()) return;
        
        // Comprobar si ya existe la consulta
        const history = get().searchHistory;
        const existingIndex = history.findIndex(
          (item) => item.query.toLowerCase() === query.toLowerCase()
        );
        
        if (existingIndex !== -1) {
          // Si existe, actualizar timestamp
          const updatedHistory = [...history];
          updatedHistory[existingIndex] = {
            query,
            timestamp: Date.now(),
          };
          set({ searchHistory: updatedHistory });
        } else {
          // Si no existe, añadir al historial
          set({
            searchHistory: [
              { query, timestamp: Date.now() },
              ...history,
            ].slice(0, 20), // Limitar a 20 elementos
          });
        }
      },
      
      clearHistory: () => set({ searchHistory: [] }),
      
      addToRecentlyVisited: (item) => {
        const recentItems = get().recentlyVisited;
        
        // Comprobar si ya existe el item
        const existingIndex = recentItems.findIndex(
          (existing) => existing.id === item.id && existing.type === item.type
        );
        
        if (existingIndex !== -1) {
          // Si existe, mover al principio
          const updatedItems = [
            item,
            ...recentItems.filter(
              (existing) => !(existing.id === item.id && existing.type === item.type)
            ),
          ];
          set({ recentlyVisited: updatedItems });
        } else {
          // Si no existe, añadir al principio
          set({
            recentlyVisited: [item, ...recentItems].slice(0, 10), // Limitar a 10 elementos
          });
        }
      },
      
      removeFromRecentlyVisited: (itemId) => {
        set({
          recentlyVisited: get().recentlyVisited.filter(
            (item) => item.id !== itemId
          ),
        });
      },
    }),
    {
      name: 'global-search-storage',
    }
  )
);

// Hook para realizar la búsqueda
export function useGlobalSearch() {
  const store = useGlobalSearchStore();
  const { query, setQuery, addToHistory, isOpen, setOpen } = store;
  
  // Realizar la consulta si el query tiene al menos 2 caracteres
  const shouldSearch = query.length >= 2;
  
  // Query para buscar resultados
  const searchResults = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!shouldSearch) return { results: [] as SearchItem[] };
      
      try {
        // Simular una pequeña demora para evitar demasiadas peticiones
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Realizar la búsqueda a través del endpoint /api/search
        const response = await axios.get('/api/search', {
          params: { q: query }
        });
        
        return response.data;
      } catch (error) {
        console.error('Error al realizar la búsqueda global:', error);
        return { results: [] as SearchItem[] };
      }
    },
    enabled: shouldSearch,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Función para ejecutar una búsqueda
  const search = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      addToHistory(searchQuery);
    }
  };
  
  // Función para realizar una búsqueda y abrir el modal
  const openSearch = () => {
    setOpen(true);
  };
  
  // Función para cerrar la búsqueda
  const closeSearch = () => {
    setOpen(false);
  };
  
  // Mock de datos para desarrollo mientras no tengamos endpoint
  const getMockResults = (): SearchItem[] => {
    if (!shouldSearch) return [];
    
    const lowerQuery = query.toLowerCase();
    
    // Resultados de prueba con tipos correctos
    const mockData: SearchItem[] = [
      {
        id: 1,
        title: 'Cómo optimizar videos para YouTube',
        subtitle: 'Tutorial de SEO',
        type: 'video',
        url: '/videos/1',
        thumbnail: 'https://api.dicebear.com/7.x/shapes/svg?seed=video1',
        status: 'completed',
        tags: ['tutorial', 'seo', 'youtube']
      },
      {
        id: 2,
        title: 'Los mejores plugins para WordPress 2025',
        subtitle: 'Guía completa',
        type: 'video',
        url: '/videos/2',
        thumbnail: 'https://api.dicebear.com/7.x/shapes/svg?seed=video2',
        status: 'content_review',
        tags: ['wordpress', 'plugins', 'web']
      },
      {
        id: 1,
        title: 'Marketing Digital',
        type: 'project',
        url: '/projects/1',
        icon: '💼',
      },
      {
        id: 2,
        title: 'Tutoriales de código',
        type: 'project',
        url: '/projects/2',
        icon: '💻',
      },
      {
        id: 1,
        title: 'Ana González',
        subtitle: 'Diseñadora UX',
        type: 'user',
        url: '/users/1',
        thumbnail: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
      }
    ];
    
    return mockData.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) || 
      item.subtitle?.toLowerCase().includes(lowerQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };
  
  // Usar datos reales cuando tengamos el endpoint, mientras tanto usar mock
  const results = searchResults.data?.results || getMockResults();
  const isLoading = searchResults.isLoading;
  
  return {
    search,
    openSearch,
    closeSearch,
    results,
    isLoading,
    ...store
  };
}
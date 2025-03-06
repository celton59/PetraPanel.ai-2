import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import type { ApiVideo } from "@/types/api";
import { useState } from "react";

// Definir la interfaz para los metadatos de paginación
interface PaginationMetadata {
  page: number;
  limit: number;
  totalVideos: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Interfaz para la respuesta del servidor
interface VideosResponse {
  videos: ApiVideo[];
  pagination: PaginationMetadata;
}

export function useVideos() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationMetadata, setPaginationMetadata] = useState<PaginationMetadata>({
    page: 1,
    limit: 10,
    totalVideos: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  const {
    data: videosData,
    isLoading,
    isFetching,
  } = useQuery<VideosResponse>({
    queryKey: ["/api/videos", page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await axios.get<VideosResponse>(`/api/videos?${params.toString()}`);

      // Guardar los metadatos de paginación
      setPaginationMetadata(response.data.pagination);

      return response.data;
    },
  });

  const videos = videosData?.videos || [];

  // Función para cambiar de página
  const changePage = (newPage: number) => {
    setPage(newPage);
  };

  // Función para cambiar el límite de elementos por página
  const changeLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Resetear a la primera página cuando cambia el límite
  };

  return {
    videos,
    isLoading,
    isFetching,
    page,
    limit,
    paginationMetadata,
    changePage,
    changeLimit
  };
}
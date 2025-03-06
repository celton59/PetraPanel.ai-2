
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Video } from '@db/schema';
import { toast } from "sonner";
import { useState } from "react";
import axios from "axios";

export type PaginationMetadata = {
  page: number;
  limit: number;
  totalVideos: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type UpdateVideoData = Omit< Partial<Video>, 'id' | 'projectId' | 'contentLastReviewedAt' | 'updatedAt' | 'mediaLastReviewedAt' | 'thumbnailUrl' >

export const getRoleStatus = 1

export type ApiVideo = {
  [K in keyof Video]: Video[K];
} & {
  contentReviewerName: User["fullName"] | null;
  contentReviewerUsername: User["username"];
  mediaReviewerName: User["fullName"] | null;
  mediaReviewerUsername: User["username"];
  creatorName: User["fullName"] | null,
  creatorUsername: User["username"],
  optimizerName: User["fullName"] | null,
  optimizerUsername: User["username"]
  uploaderName: User["fullName"] | null,
  uploaderUsername: User["username"]
}

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

      const res = await fetch(`/api/videos?${params.toString()}`, {
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Error al cargar los videos");
      }
      
      const data = await res.json();
      setPaginationMetadata(data.pagination);
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Datos considerados frescos por 5 minutos
    gcTime: 30 * 60 * 1000 // Tiempo de recolección de basura (antes cacheTime)
  });

  const createVideoMutation = useMutation({
    mutationFn: async (video: Pick<Video, "title" | "description" | "projectId">) => {
      const res = await fetch(`/api/projects/${video.projectId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(video),
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Error al crear el video");
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${data.projectId}/videos`] });
      toast.success("Video creado", {
        description: "El video se ha creado correctamente",
      });
    },
    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message || "No se pudo crear el video",
      });
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({
      videoId,
      projectId,
      updateRequest,
    }: {
      videoId: number;
      projectId: number;
      updateRequest: UpdateVideoData;
    }) => {
      const res = await fetch(`/api/projects/${projectId}/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateRequest),
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Error al actualizar el video");
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${data.projectId}/videos`] });
      toast.success("Video actualizado", {
        description: "El video se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message || "No se pudo actualizar el video",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async ({
      videoId,
      projectId,
    }: {
      videoId: number;
      projectId: number;
    }) => {
      const res = await fetch(`/api/projects/${projectId}/videos/${videoId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Error al eliminar el video");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      toast.success("Video eliminado", {
        description: "El video se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast("Error", {
        description: error.message || "No se pudo eliminar el video",
      });
    },
  });

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
    videos: videosData?.videos || [],
    isLoading,
    isFetching,
    createVideo: createVideoMutation.mutateAsync,
    updateVideo: updateVideoMutation.mutateAsync,
    deleteVideo: deleteVideoMutation.mutateAsync,
    page,
    limit,
    paginationMetadata,
    changePage,
    changeLimit
  };
}

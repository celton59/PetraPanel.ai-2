import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Video } from '@db/schema'
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";

export type PaginationMetadata = {
  page: number;
  limit: number;
  totalVideos: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type SortConfig = {
  field: string;
  order: 'asc' | 'desc';
};

export type UpdateVideoData = Omit<Partial<Video>, 'id' | 'projectId' | 'contentLastReviewedAt' | 'updatedAt' | 'mediaLastReviewedAt' | 'thumbnailUrl'>;

export type ApiVideo = {
  [K in keyof Video]: Video[K];
} & {
  contentReviewerName: User["fullName"] | null;
  contentReviewerUsername: User["username"];
  mediaReviewerName: User["fullName"] | null;
  mediaReviewerUsername: User["username"];
  creatorName: User["fullName"] | null;
  creatorUsername: User["username"];
  optimizerName: User["fullName"] | null;
  optimizerUsername: User["username"];
  uploaderName: User["fullName"] | null;
  uploaderUsername: User["username"];
  deletedByName: User["fullName"] | null;
  deletedByUsername: User["username"] | null;
};

export function useVideos() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<SortConfig>({
    field: 'updatedAt',
    order: 'desc'
  });

  // Reset to page 1 when changing limit or sort
  useEffect(() => {
    setPage(1);
  }, [limit, sort]);

  const queryKey = ["/api/videos", page, limit, sort.field, sort.order];

  const {
    data: videosData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const api = (await import('../lib/axios')).default;
        const response = await api.get(queryKey[0] as string, {
          params: {
            page,
            limit,
            sortField: sort.field,
            sortOrder: sort.order
          }
        });
        return response.data;
      } catch (error: any) {
        console.error('Error al cargar los videos:', error);
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw new Error("Error al cargar los videos");
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const createVideoMutation = useMutation({
    mutationFn: async (video: Pick<Video, "title" | "description" | "projectId">) => {
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      try {
        await refreshCSRFToken();
        const response = await api.post(`/api/projects/${video.projectId}/videos`, video);
        return response.data;
      } catch (error: any) {
        console.error("Error creating video:", error);
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        throw new Error(error.response?.data?.message || error.message || "Error al crear el video");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${data.projectId}/videos`] });
      toast.success("Video creado", {
        description: "El video se ha creado correctamente",
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.message || "No se pudo crear el video",
        });
      }
    },
  });

  const createBulkVideosMutation = useMutation({
    mutationFn: async ({ projectId, titles }: { projectId: number, titles: string[] }) => {
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      try {
        await refreshCSRFToken();
        const response = await api.post(`/api/projects/${projectId}/videos/bulk`, { titles });
        return response.data;
      } catch (error: any) {
        console.error("Error creating videos in bulk:", error);
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        throw new Error(error.response?.data?.message || error.message || "Error al crear los videos en masa");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      if (data.data && data.data.length > 0) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${data.data[0].projectId}/videos`] });
      }
      toast.success("Videos creados", {
        description: data.message || `Se han creado ${data.data?.length || 0} videos correctamente`,
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.message || "No se pudieron crear los videos en masa",
        });
      }
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({ videoId, projectId, updateRequest }: { videoId: number; projectId: number, updateRequest: UpdateVideoData }) => {
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      console.log('Datos de actualización:', updateRequest);
      try {
        await refreshCSRFToken();
        const response = await api.patch(`/api/projects/${projectId}/videos/${videoId}`, updateRequest);
        return response.data;
      } catch (error: any) {
        console.error("Error updating video:", error);
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        throw new Error(error.response?.data?.message || error.message || "Error al actualizar el video");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${data.projectId}/videos`] });
      toast.success("Video actualizado", {
        description: "El video se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.message || "No se pudo actualizar el video",
        });
      }
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async ({videoId, projectId, permanent = false } : { videoId: number, projectId: number, permanent?: boolean }) => {
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      try {
        await refreshCSRFToken();
        const response = await api.delete(`/api/projects/${projectId}/videos/${videoId}${permanent ? '?permanent=true' : ''}`);
        return response.data;
      } catch (error: any) {
        console.error("Error deleting video:", error);
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        throw new Error(error.response?.data?.message || error.message || "Error al eliminar el video");
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(variables.permanent ? "Video eliminado permanentemente" : "Video movido a la papelera", {
        description: variables.permanent 
          ? "El video ha sido eliminado permanentemente" 
          : "El video se ha movido a la papelera"
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.message || "No se pudo eliminar el video",
        });
      }
    },
  });

  const bulkDeleteVideosMutation = useMutation({
    mutationFn: async ({projectId, videoIds, permanent = false} : { projectId: number, videoIds: number[], permanent?: boolean }) => {
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      try {
        await refreshCSRFToken();
        const response = await api.delete(`/api/projects/${projectId}/videos${permanent ? '?permanent=true' : ''}`, {
          data: { videoIds } 
        });
        return response.data;
      } catch (error: any) {
        console.error("Error bulk deleting videos:", error);
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        throw new Error(error.response?.data?.message || error.message || "Error al eliminar los videos en masa");
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(variables.permanent ? "Videos eliminados permanentemente" : "Videos movidos a la papelera", {
        description: variables.permanent 
          ? `Se han eliminado permanentemente ${data.deleted || 0} videos` 
          : `Se han movido ${data.deleted || 0} videos a la papelera`
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.message || "No se pudieron eliminar los videos en masa",
        });
      }
    },
  });

  const restoreVideoMutation = useMutation({
    mutationFn: async ({videoId, projectId}: { videoId: number, projectId: number }) => {
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      try {
        await refreshCSRFToken();
        const response = await api.post(`/api/projects/${projectId}/videos/${videoId}/restore`);
        return response.data;
      } catch (error: any) {
        console.error("Error restoring video:", error);
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        throw new Error(error.response?.data?.message || error.message || "Error al restaurar el video");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Video restaurado", {
        description: "El video ha sido restaurado correctamente",
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.message || "No se pudo restaurar el video",
        });
      }
    },
  });

  const emptyTrashMutation = useMutation({
    mutationFn: async ({projectId}: { projectId: number }) => {
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      try {
        await refreshCSRFToken();
        const response = await api.delete(`/api/projects/${projectId}/trash`);
        return response.data;
      } catch (error: any) {
        console.error("Error emptying trash:", error);
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        throw new Error(error.response?.data?.message || error.message || "Error al vaciar la papelera");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Papelera vaciada", {
        description: "Se han eliminado permanentemente todos los videos de la papelera",
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.message || "No se pudo vaciar la papelera",
        });
      }
    },
  });

  const getTrashVideos = useCallback(async ({projectId}: { projectId: number }): Promise<ApiVideo[]> => {
    try {
      const api = (await import('../lib/axios')).default;
      const response = await api.get(`/api/projects/${projectId}/videos?trash=true`);
      return response.data;
    } catch (error: any) {
      console.error("Error getting trash videos:", error);
      throw new Error(error.response?.data?.message || error.message || "Error al obtener los videos de la papelera");
    }
  }, []);

  const assignVideoToYoutuberMutation = useMutation({
    mutationFn: async ({videoId, projectId}: { videoId: number, projectId: number }) => {
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      try {
        await refreshCSRFToken();
        const response = await api.post(`/api/projects/${projectId}/videos/${videoId}/assign`);
        return response.data;
      } catch (error: any) {
        console.error("Error assigning video to youtuber:", error);
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        if (error.response?.status === 403 && error.response?.data?.message?.includes('asignado a otro youtuber')) {
          throw new Error(error.response?.data?.message || "Este video ya está asignado a otro youtuber");
        }
        throw new Error(error.response?.data?.message || error.message || "Error al asignar el video");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["video-limits"] });
    },
    onError: (error: Error) => {
      if (!error.message.includes('ya está asignado a este youtuber')) {
        if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
          toast.error("Error de seguridad", {
            description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
          });
        } else if (error.message.includes('asignado a otro youtuber')) {
          toast.error("Video no disponible", {
            description: "Este video ya está siendo trabajado por otro youtuber",
          });
        } else {
          toast.error("Error", {
            description: error.message || "No se pudo asignar el video",
          });
        }
      }
    },
  });

  const pagination: PaginationMetadata = videosData?.pagination || {
    page,
    limit,
    totalVideos: (videosData?.videos && videosData.videos.length) || 0,
    totalPages: (videosData?.videos && videosData.videos.length > 0) ? 1 : 0,
    hasNextPage: false,
    hasPrevPage: false
  };

  return {
    videos: videosData?.videos || [],
    isLoading,
    isFetching,
    pagination,
    setPage,
    setLimit,
    page,
    limit,
    sort,
    setSort,
    createVideo: createVideoMutation.mutateAsync,
    createBulkVideos: createBulkVideosMutation.mutateAsync,
    updateVideo: updateVideoMutation.mutateAsync,
    deleteVideo: deleteVideoMutation.mutateAsync,
    bulkDeleteVideos: bulkDeleteVideosMutation.mutateAsync,
    restoreVideo: restoreVideoMutation.mutateAsync,
    emptyTrash: emptyTrashMutation.mutateAsync,
    getTrashVideos,
    assignVideoToYoutuber: assignVideoToYoutuberMutation.mutateAsync,
  };
}
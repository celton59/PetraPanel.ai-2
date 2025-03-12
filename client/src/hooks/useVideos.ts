import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Video } from '@db/schema'
import { toast } from "sonner";
import { useCallback } from "react";
import { useState } from "react";

export type PaginationMetadata = {
  page: number;
  limit: number;
  totalVideos: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type UpdateVideoData = Omit< Partial<Video>, 'id' | 'projectId' | 'contentLastReviewedAt' | 'updatedAt' | 'mediaLastReviewedAt' | 'thumbnailUrl' >


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
  optimizerUsername: User["username"],
  uploaderName: User["fullName"] | null,
  uploaderUsername: User["username"],
  deletedByName: User["fullName"] | null,
  deletedByUsername: User["username"] | null
}

interface VideosResponse {
  videos: ApiVideo[];
  isLoading: boolean;
  createVideo: (video: Pick<Video, "title" | "description" | "projectId">) => Promise<any>;
  createBulkVideos: ({ projectId, titles }: { projectId: number, titles: string[] }) => Promise<any>;
  updateVideo: ({ videoId, projectId, updateRequest }: { videoId: number; projectId: number; updateRequest: UpdateVideoData }) => Promise<any>;
  deleteVideo: ({videoId, projectId, permanent }: { videoId: number, projectId: number, permanent?: boolean }) => Promise<any>;
  bulkDeleteVideos: ({projectId, videoIds, permanent }: { projectId: number, videoIds: number[], permanent?: boolean }) => Promise<any>;
  restoreVideo: ({videoId, projectId}: { videoId: number, projectId: number }) => Promise<any>;
  emptyTrash: ({projectId}: { projectId: number }) => Promise<any>;
  getTrashVideos: ({projectId}: { projectId: number }) => Promise<ApiVideo[]>;
  pagination: PaginationMetadata;
assignVideoToYoutuber: ({videoId, projectId}: { videoId: number, projectId: number }) => Promise<any>;
}

export function useVideos() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const queryKey = ["/api/videos", page, limit]

  const {
    data: videosData,
    isLoading,
    isFetching,
  } = useQuery<VideosResponse>({
    queryKey,
    queryFn: async () => {

      try {
        // Usamos axios para beneficiarnos del manejo de CSRF y credenciales
        const api = (await import('../lib/axios')).default;
        const response = await api.get(queryKey[0] as string);
        return response.data;
      } catch (error: any) {
        console.error('Error al cargar los videos:', error);
        // Mostramos el mensaje de error de la API si está disponible
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        // Error genérico
        throw new Error("Error al cargar los videos");
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Datos considerados frescos por 5 minutos
    gcTime: 30 * 60 * 1000 // Tiempo de recolección de basura (antes cacheTime)
  });

  const createVideoMutation = useMutation({
    mutationFn: async (video: Pick<Video, "title" | "description" | "projectId">) => {
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.post(`/api/projects/${video.projectId}/videos`, video);
        return response.data;
      } catch (error: any) {
        console.error("Error creating video:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        // Otros errores
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
      // Si es un error de CSRF, mostramos un mensaje más amigable
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
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.post(`/api/projects/${projectId}/videos/bulk`, { titles });
        return response.data;
      } catch (error: any) {
        console.error("Error creating videos in bulk:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        // Otros errores
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
      // Si es un error de CSRF, mostramos un mensaje más amigable
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

      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      console.log('Datos de actualización:', updateRequest);
      
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.patch(`/api/projects/${projectId}/videos/${videoId}`, updateRequest);
        return response.data;
      } catch (error: any) {
        console.error("Error updating video:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        // Otros errores
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
      // Si es un error de CSRF, mostramos un mensaje más amigable
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

      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.delete(`/api/projects/${projectId}/videos/${videoId}${permanent ? '?permanent=true' : ''}`);
        return response.data;
      } catch (error: any) {
        console.error("Error deleting video:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        // Otros errores
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
      // Si es un error de CSRF, mostramos un mensaje más amigable
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

      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.delete(`/api/projects/${projectId}/videos${permanent ? '?permanent=true' : ''}`, {
          data: { videoIds } // Axios requiere que el body en DELETE esté en data
        });
        return response.data;
      } catch (error: any) {
        console.error("Error bulk deleting videos:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        // Otros errores
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
      // Si es un error de CSRF, mostramos un mensaje más amigable
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

  // Nueva función para restaurar videos de la papelera
  const restoreVideoMutation = useMutation({
    mutationFn: async ({videoId, projectId}: { videoId: number, projectId: number }) => {

      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.post(`/api/projects/${projectId}/videos/${videoId}/restore`);
        return response.data;
      } catch (error: any) {
        console.error("Error restoring video:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        // Otros errores
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
      // Si es un error de CSRF, mostramos un mensaje más amigable
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

  // Nueva función para vaciar la papelera de un proyecto
  const emptyTrashMutation = useMutation({
    mutationFn: async ({projectId}: { projectId: number }) => {

      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.delete(`/api/projects/${projectId}/trash`);
        return response.data;
      } catch (error: any) {
        console.error("Error emptying trash:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        // Otros errores
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
      // Si es un error de CSRF, mostramos un mensaje más amigable
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

  // Nueva función para obtener los videos en la papelera, memoizada para evitar recreación
  const getTrashVideos = useCallback(async ({projectId}: { projectId: number }): Promise<ApiVideo[]> => {
    try {
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const api = (await import('../lib/axios')).default;
      
      // Para operaciones de consulta no es necesario refrescar el token CSRF
      // pero usamos nuestra instancia de axios configurada con withCredentials
      const response = await api.get(`/api/projects/${projectId}/videos?trash=true`);
      return response.data;
    } catch (error: any) {
      console.error("Error getting trash videos:", error);
      
      // Manejo de errores
      throw new Error(error.response?.data?.message || error.message || "Error al obtener los videos de la papelera");
    }
  }, []);

  // Función para asignar un video a un youtuber cuando lo visualiza
  const assignVideoToYoutuberMutation = useMutation({
    mutationFn: async ({videoId, projectId}: { videoId: number, projectId: number }) => {
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con manejo CSRF
        const response = await api.post(`/api/projects/${projectId}/videos/${videoId}/assign`);
        return response.data;
      } catch (error: any) {
        console.error("Error assigning video to youtuber:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        // Error cuando el video ya está asignado a otro youtuber
        if (error.response?.status === 403 && error.response?.data?.message?.includes('asignado a otro youtuber')) {
          throw new Error(error.response?.data?.message || "Este video ya está asignado a otro youtuber");
        }
        
        // Otros errores
        throw new Error(error.response?.data?.message || error.message || "Error al asignar el video");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // No mostramos toast aquí para evitar notificaciones innecesarias al usuario
    },
    onError: (error: Error) => {
      // Solo mostramos notificación si no es el caso de que ya está asignado al mismo youtuber
      if (!error.message.includes('ya está asignado a este youtuber')) {
        // Si es un error de CSRF, mostramos un mensaje más amigable
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

  return {
    videos: videosData?.videos || [],
    isLoading,
    isFetching,
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

import { 
  useMutation, 
  useQuery, 
  useQueryClient, 
  useInfiniteQuery, 
  QueryKey, 
  MutationFunction
} from "@tanstack/react-query";
import { User, Video } from '@db/schema'
import { toast } from "sonner";
import { useCallback, useState } from "react";

// Tipos y constantes
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

// Configuración de la API
const API_CONFIG = {
  BASE_URL: '',
  ENDPOINTS: {
    VIDEOS: '/api/videos',
    PROJECT_VIDEOS: (projectId: number) => `/api/projects/${projectId}/videos`,
    VIDEO_DETAIL: (projectId: number, videoId: number) => `/api/projects/${projectId}/videos/${videoId}`,
    VIDEO_RESTORE: (projectId: number, videoId: number) => `/api/projects/${projectId}/videos/${videoId}/restore`,
    PROJECT_TRASH: (projectId: number) => `/api/projects/${projectId}/trash`
  },
  DEFAULT_OPTIONS: {
    credentials: 'include' as RequestCredentials,
    headers: { 'Content-Type': 'application/json' }
  },
  CACHE_TIME: {
    SHORT: 1 * 60 * 1000, // 1 minuto
    MEDIUM: 5 * 60 * 1000, // 5 minutos
    LONG: 30 * 60 * 1000   // 30 minutos
  }
}

// Utilidades para llamadas API
const apiClient = {
  async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...API_CONFIG.DEFAULT_OPTIONS,
      ...options
    });

    if (!response.ok) {
      // Intentar obtener mensaje de error si está disponible
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error en la petición: ${response.status}`);
      } catch (e) {
        // Si no se puede parsear como JSON, usar mensaje genérico
        const errorText = await response.text();
        throw new Error(errorText || `Error en la petición: ${response.status}`);
      }
    }

    return response.json();
  },

  // Crea un método fetch específico para cada tipo de operación
  get<T>(url: string): Promise<T> {
    return this.fetchJson<T>(url);
  },

  post<T, D>(url: string, data: D): Promise<T> {
    return this.fetchJson<T>(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  patch<T, D>(url: string, data: D): Promise<T> {
    return this.fetchJson<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  delete<T, D = undefined>(url: string, data?: D): Promise<T> {
    const options: RequestInit = {
      method: 'DELETE'
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    return this.fetchJson<T>(url, options);
  }
};

// Funciones de servicio
const videoService = {
  getAllVideos(): Promise<ApiVideo[]> {
    return apiClient.get<ApiVideo[]>(API_CONFIG.ENDPOINTS.VIDEOS);
  },

  getTrashVideos(projectId: number): Promise<ApiVideo[]> {
    return apiClient.get<ApiVideo[]>(`${API_CONFIG.ENDPOINTS.PROJECT_VIDEOS(projectId)}?trash=true`);
  },

  createVideo(video: Pick<Video, "title" | "description" | "projectId">): Promise<any> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PROJECT_VIDEOS(video.projectId), video);
  },

  createBulkVideos(projectId: number, titles: string[]): Promise<any> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PROJECT_VIDEOS(projectId) + '/bulk', { titles });
  },

  updateVideo(videoId: number, projectId: number, updateRequest: UpdateVideoData): Promise<any> {
    return apiClient.patch(API_CONFIG.ENDPOINTS.VIDEO_DETAIL(projectId, videoId), updateRequest);
  },

  deleteVideo(videoId: number, projectId: number, permanent: boolean = false): Promise<any> {
    const url = `${API_CONFIG.ENDPOINTS.VIDEO_DETAIL(projectId, videoId)}${permanent ? '?permanent=true' : ''}`;
    return apiClient.delete(url);
  },

  bulkDeleteVideos(projectId: number, videoIds: number[], permanent: boolean = false): Promise<any> {
    const url = `${API_CONFIG.ENDPOINTS.PROJECT_VIDEOS(projectId)}${permanent ? '?permanent=true' : ''}`;
    return apiClient.delete(url, { videoIds });
  },

  restoreVideo(videoId: number, projectId: number): Promise<any> {
    return apiClient.post(API_CONFIG.ENDPOINTS.VIDEO_RESTORE(projectId, videoId), {});
  },

  emptyTrash(projectId: number): Promise<any> {
    return apiClient.delete(API_CONFIG.ENDPOINTS.PROJECT_TRASH(projectId));
  }
};

// Funciones de utilidad para React Query
function createMutation<TData, TVariables, TError = Error, TContext = unknown>(
  mutationFn: MutationFunction<TData, TVariables>,
  options: {
    onSuccessMessage?: string | ((data: TData, variables: TVariables) => string);
    onSuccessDescription?: string | ((data: TData, variables: TVariables) => string);
    onErrorMessage?: string;
    onErrorDescription?: string | ((error: TError) => string);
    invalidateQueries?: QueryKey | Array<QueryKey>;
  } = {}
) {
  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    onSuccess: (data, variables, context) => {
      const queryClient = useQueryClient();
      
      // Invalidar las consultas necesarias
      if (options.invalidateQueries) {
        const queriesToInvalidate = Array.isArray(options.invalidateQueries[0]) 
          ? options.invalidateQueries as Array<QueryKey>
          : [options.invalidateQueries as QueryKey];
          
        queriesToInvalidate.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      // Mostrar notificación de éxito
      if (options.onSuccessMessage) {
        const successMessage = typeof options.onSuccessMessage === 'function'
          ? options.onSuccessMessage(data, variables)
          : options.onSuccessMessage;
        
        const description = typeof options.onSuccessDescription === 'function'
          ? options.onSuccessDescription(data, variables)
          : options.onSuccessDescription;
        
        toast.success(successMessage as string, {
          description: description as string
        });
      }
    },
    onError: (error: TError) => {
      // Mostrar notificación de error
      const errorDescription = typeof options.onErrorDescription === 'function'
        ? options.onErrorDescription(error)
        : (options.onErrorDescription || (error as Error).message || "Ha ocurrido un error");
        
      toast.error(options.onErrorMessage || "Error", {
        description: errorDescription as string
      });
    }
  });
}

// Hook principal
export function useVideos() {
  const queryClient = useQueryClient();
  const ALL_VIDEOS_KEY = [API_CONFIG.ENDPOINTS.VIDEOS];

  // Consulta principal para obtener todos los videos
  const { 
    data: videos, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery<ApiVideo[]>({
    queryKey: ALL_VIDEOS_KEY,
    queryFn: videoService.getAllVideos,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: API_CONFIG.CACHE_TIME.MEDIUM,
    gcTime: API_CONFIG.CACHE_TIME.LONG
  });

  // Mutación para crear un video
  const createVideoMutation = createMutation(
    (video: Pick<Video, "title" | "description" | "projectId">) => 
      videoService.createVideo(video),
    {
      onSuccessMessage: "Video creado",
      onSuccessDescription: "El video se ha creado correctamente",
      onErrorMessage: "Error",
      onErrorDescription: (error: Error) => error.message || "No se pudo crear el video",
      invalidateQueries: [
        ALL_VIDEOS_KEY,
        (data: any) => data?.projectId ? [`/api/projects/${data.projectId}/videos`] : []
      ]
    }
  );
  
  // Mutación para crear múltiples videos
  const createBulkVideosMutation = createMutation(
    ({ projectId, titles }: { projectId: number, titles: string[] }) => 
      videoService.createBulkVideos(projectId, titles),
    {
      onSuccessMessage: "Videos creados",
      onSuccessDescription: (data: any) => 
        data.message || `Se han creado ${data.data?.length || 0} videos correctamente`,
      onErrorMessage: "Error",
      onErrorDescription: (error: Error) => 
        error.message || "No se pudieron crear los videos en masa",
      invalidateQueries: [
        ALL_VIDEOS_KEY,
        (data: any) => data?.data && data.data.length > 0 
          ? [`/api/projects/${data.data[0].projectId}/videos`] 
          : []
      ]
    }
  );

  // Mutación para actualizar un video
  const updateVideoMutation = createMutation(
    ({ videoId, projectId, updateRequest }: { videoId: number; projectId: number, updateRequest: UpdateVideoData }) => 
      videoService.updateVideo(videoId, projectId, updateRequest),
    {
      onSuccessMessage: "Video actualizado",
      onSuccessDescription: "El video se ha actualizado correctamente",
      onErrorMessage: "Error",
      onErrorDescription: (error: Error) => error.message || "No se pudo actualizar el video",
      invalidateQueries: [ALL_VIDEOS_KEY]
    }
  );

  // Mutación para eliminar un video
  const deleteVideoMutation = createMutation(
    ({videoId, projectId, permanent = false}: { videoId: number, projectId: number, permanent?: boolean }) => 
      videoService.deleteVideo(videoId, projectId, permanent),
    {
      onSuccessMessage: (data: any, variables: {permanent?: boolean}) => 
        variables.permanent ? "Video eliminado permanentemente" : "Video movido a la papelera",
      onSuccessDescription: (data: any, variables: {permanent?: boolean}) => 
        variables.permanent 
          ? "El video ha sido eliminado permanentemente" 
          : "El video se ha movido a la papelera",
      onErrorMessage: "Error",
      onErrorDescription: (error: Error) => error.message || "No se pudo eliminar el video",
      invalidateQueries: [ALL_VIDEOS_KEY]
    }
  );

  // Mutación para eliminar múltiples videos
  const bulkDeleteVideosMutation = createMutation(
    ({projectId, videoIds, permanent = false}: { projectId: number, videoIds: number[], permanent?: boolean }) => 
      videoService.bulkDeleteVideos(projectId, videoIds, permanent),
    {
      onSuccessMessage: (data: any, variables: {permanent?: boolean}) => 
        variables.permanent ? "Videos eliminados permanentemente" : "Videos movidos a la papelera",
      onSuccessDescription: (data: any, variables: {permanent?: boolean}) => 
        variables.permanent 
          ? `Se han eliminado permanentemente ${data.deleted || 0} videos` 
          : `Se han movido ${data.deleted || 0} videos a la papelera`,
      onErrorMessage: "Error",
      onErrorDescription: (error: Error) => error.message || "No se pudieron eliminar los videos en masa",
      invalidateQueries: [ALL_VIDEOS_KEY]
    }
  );

  // Mutación para restaurar un video
  const restoreVideoMutation = createMutation(
    ({videoId, projectId}: { videoId: number, projectId: number }) => 
      videoService.restoreVideo(videoId, projectId),
    {
      onSuccessMessage: "Video restaurado",
      onSuccessDescription: "El video ha sido restaurado correctamente",
      onErrorMessage: "Error",
      onErrorDescription: (error: Error) => error.message || "No se pudo restaurar el video",
      invalidateQueries: [ALL_VIDEOS_KEY]
    }
  );

  // Mutación para vaciar la papelera
  const emptyTrashMutation = createMutation(
    ({projectId}: { projectId: number }) => 
      videoService.emptyTrash(projectId),
    {
      onSuccessMessage: "Papelera vaciada",
      onSuccessDescription: "Se han eliminado permanentemente todos los videos de la papelera",
      onErrorMessage: "Error",
      onErrorDescription: (error: Error) => error.message || "No se pudo vaciar la papelera",
      invalidateQueries: [ALL_VIDEOS_KEY]
    }
  );

  // Función para obtener videos de la papelera, adaptada para prefetch si es necesario
  const getTrashVideos = useCallback(async ({projectId}: { projectId: number }): Promise<ApiVideo[]> => {
    const trashQueryKey = [`/api/projects/${projectId}/videos`, { trash: true }];
    
    // Intentar obtener de caché primero
    const cachedData = queryClient.getQueryData<ApiVideo[]>(trashQueryKey);
    if (cachedData) return cachedData;
    
    // Si no está en caché, hacer la llamada y guardar en caché
    try {
      const data = await videoService.getTrashVideos(projectId);
      queryClient.setQueryData(trashQueryKey, data);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al obtener videos de la papelera";
      throw new Error(errorMessage);
    }
  }, [queryClient]);

  // Función de prefetch de videos por proyecto para mejorar UX
  const prefetchProjectVideos = useCallback((projectId: number) => {
    const projectVideosKey = [`/api/projects/${projectId}/videos`];
    return queryClient.prefetchQuery({
      queryKey: projectVideosKey,
      queryFn: () => apiClient.get(`/api/projects/${projectId}/videos`),
      staleTime: API_CONFIG.CACHE_TIME.MEDIUM
    });
  }, [queryClient]);

  return {
    // Datos
    videos: videos ?? [],
    isLoading,
    isError,
    error,
    
    // Acciones
    refetch,
    prefetchProjectVideos,
    
    // Operaciones CRUD
    createVideo: createVideoMutation.mutateAsync,
    createBulkVideos: createBulkVideosMutation.mutateAsync,
    updateVideo: updateVideoMutation.mutateAsync,
    deleteVideo: deleteVideoMutation.mutateAsync,
    bulkDeleteVideos: bulkDeleteVideosMutation.mutateAsync,
    restoreVideo: restoreVideoMutation.mutateAsync,
    emptyTrash: emptyTrashMutation.mutateAsync,
    getTrashVideos,
  };
}
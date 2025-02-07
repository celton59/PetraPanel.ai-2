import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { Prisma, Video, User, VideoStatus } from '@prisma/client'


interface MediaCorrections {
  needsVideoCorrection: boolean;
  needsThumbnailCorrection: boolean;
  originalVideoUrl: string | null;
  originalThumbnailUrl: string | null;
}

export interface UpdateVideoData {
  title?: string;
  description?: string | null;
  status?: VideoStatus;
  optimizedTitle?: string | null;
  optimizedDescription?: string | null;
  tags?: string | null;
  currentReviewerId?: number | null;
  lastReviewComments?: string | null;
  mediaCorrections?: MediaCorrections;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  metadata?: VideoMetadata;
  title_corrected?: boolean;
  media_corrected?: boolean;
}

// Añadir la función determineNextStatus
// export const determineNextStatus = (currentStatus: VideoStatus, userRole: string): VideoStatus | undefined => {
//   // Si el usuario es viewer o el rol no existe, no cambiamos el estado
//   if (userRole === 'viewer' || !userRole) {
//     return undefined;
//   }

//   // Mapa de transiciones automáticas al asignar un video
//   const autoTransitions: Record<string, Record<VideoStatus, VideoStatus | undefined>> = {
//     optimizer: {
//       pending: 'in_progress',  // Permitir que el optimizador cambie de pending a in_progress
//       title_corrections: 'in_progress',
//       in_progress: undefined,
//       optimize_review: undefined,
//       upload_review: undefined,
//       youtube_ready: undefined,
//       review: undefined,
//       media_corrections: undefined,
//       completed: undefined
//     },
//     reviewer: {
//       pending: undefined,
//       in_progress: undefined,
//       title_corrections: undefined,
//       optimize_review: 'youtube_ready',
//       upload_review: 'optimize_review',
//       youtube_ready: undefined,
//       review: undefined,
//       media_corrections: 'upload_review',
//       completed: undefined
//     },
//     uploader: {
//       pending: undefined,
//       in_progress: undefined,
//       title_corrections: undefined,
//       optimize_review: undefined,
//       upload_review: undefined,
//       youtube_ready: undefined,
//       review: undefined,
//       media_corrections: 'upload_review',
//       completed: undefined
//     },
//     admin: {
//       pending: 'in_progress',
//       in_progress: undefined,
//       title_corrections: 'in_progress',
//       optimize_review: 'youtube_ready',
//       upload_review: 'optimize_review',
//       youtube_ready: undefined,
//       review: undefined,
//       media_corrections: 'upload_review',
//       completed: undefined
//     }
//   };

//   return autoTransitions[userRole]?.[currentStatus];
// };

const statusTransitions: Record<User['role'], Record<VideoStatus, VideoStatus[]>> = {
  optimizer: {
    pending: ["in_progress"],  // Permitir que el optimizador vea y trabaje con videos pending
    in_progress: ["optimize_review"],
    title_corrections: ["optimize_review"],
    optimize_review: ["youtube_ready"],
    upload_review: ["youtube_ready"],
    youtube_ready: ["completed"],
    review: [],
    media_corrections: [],
    completed: []
  },
  reviewer: {
    pending: [],
    in_progress: [],
    title_corrections: ["optimize_review"],
    optimize_review: ["title_corrections", "upload_review", "completed"],
    upload_review: ["optimize_review", "completed"],
    youtube_ready: ["completed"],
    review: [],
    media_corrections: ["upload_review"],
    completed: []
  },
  uploader: {
    pending: [],
    in_progress: [],
    title_corrections: [],
    optimize_review: ["youtube_ready"],
    upload_review: ["optimize_review", "youtube_ready"],
    youtube_ready: ["completed"],
    review: [],
    media_corrections: ["upload_review", "youtube_ready"],
    completed: []
  },
  admin: {
    pending: ["in_progress", "optimize_review", "title_corrections", "upload_review", "youtube_ready", "completed"],
    in_progress: ["pending", "optimize_review", "title_corrections", "upload_review", "youtube_ready", "completed"],
    title_corrections: ["pending", "in_progress", "optimize_review", "upload_review", "youtube_ready", "completed"],
    optimize_review: ["pending", "in_progress", "title_corrections", "upload_review", "youtube_ready", "completed"],
    upload_review: ["pending", "in_progress", "optimize_review", "title_corrections", "youtube_ready", "completed"],
    review: ["pending", "in_progress", "optimize_review", "title_corrections", "upload_review", "youtube_ready", "completed"],
    media_corrections: ["pending", "in_progress", "optimize_review", "title_corrections", "upload_review", "youtube_ready", "completed"],
    youtube_ready: ["pending", "in_progress", "optimize_review", "title_corrections", "upload_review", "completed"],
    completed: ["pending", "in_progress", "optimize_review", "title_corrections", "upload_review", "youtube_ready"]
  }
};

const canUpdateVideoStatus = (currentRole: User['role'], currentStatus: VideoStatus, newStatus: VideoStatus): boolean => {
  // Si es admin, permitir todas las transiciones
  if (currentRole === 'admin') {
    return true;
  }

  // Si el estado actual es in_progress y el rol es optimizer, permitir la edición
  if (currentStatus === 'in_progress' && currentRole === 'optimizer') {
    return true;
  }

  const allowedTransitions = statusTransitions[currentRole]?.[currentStatus] || []
  return allowedTransitions.includes(newStatus)
};

// Función mejorada para obtener el estado efectivo considerando metadata
// const getEffectiveStatus = (video: any, userRole?: string, currentUser?: any) => {
//   const roleStatus = getRoleStatus(video.status as VideoStatus);

//   // Verificar si el rol actual tiene acceso al video
//   if (!roleStatus[userRole as string] || roleStatus[userRole as string] === 'no_disponible') {
//     return 'no_disponible';
//   }

//   // Verificar estados específicos por rol en metadata
//   if (video.metadata?.roleView) {
//     if (userRole === 'optimizer' && video.metadata.roleView.optimizer) {
//       return video.metadata.roleView.optimizer.status;
//     }
//     if (userRole === 'reviewer' && video.metadata.roleView.reviewer) {
//       return video.metadata.roleView.reviewer.titleReview?.status || video.metadata.roleView.reviewer.contentReview?.status || 'disponible';
//     }
//   }

//   // Si el video tiene un estado personalizado en metadata, tiene prioridad
//   if (video.metadata?.customStatus) {
//     return video.metadata.customStatus;
//   }

//   // Para el rol reviewer
//   if (userRole === 'reviewer') {
//     if (video.status === 'optimize_review') {
//       const lastApproval = video.metadata?.optimization?.approvalHistory?.[
//         video.metadata.optimization.approvalHistory?.length - 1
//       ];

//       if (lastApproval?.action === 'rejected' || video.metadata?.secondaryStatus?.type === 'title_rejected') {
//         return 'en_revision';
//       }
//       return 'disponible';
//     }

//     if (video.status === 'title_corrections') {
//       return 'en_revision';
//     }
//   }

//   // Para otros roles, mantener la lógica existente
//   switch (userRole) {
//     case 'youtuber':
//       if (video.status === 'upload_review' || video.status === 'youtube_ready') {
//         return video.currentReviewerId === currentUser?.id ? 'asignado' : 'video_disponible';
//       }
//       break;

//     case 'optimizer':
//       if (['pending', 'in_progress', 'optimize_review', 'title_corrections'].includes(video.status)) {
//         return video.metadata?.optimization?.assignedTo?.userId === currentUser?.id ?
//           'en_proceso' : 'disponible';
//       }
//       break;
//   }

//   // Si no hay reglas específicas, usar el estado del video
//   return roleStatus[userRole as string] || video.status;
// };

// export const getRoleStatus = (status: VideoStatus): Record<string, string> => {
//   const roleStatuses = {
//     pending: {
//       admin: 'disponible',
//       optimizer: 'disponible',
//       reviewer: 'no_disponible',
//       youtuber: 'no_disponible',
//       uploader: 'no_disponible'
//     },
//     in_progress: {
//       admin: 'disponible',
//       optimizer: 'disponible',
//       reviewer: 'no_disponible',
//       youtuber: 'no_disponible',
//       uploader: 'no_disponible'
//     },
//     optimize_review: {
//       admin: 'disponible',
//       optimizer: 'disponible',
//       reviewer: 'disponible',
//       youtuber: 'no_disponible',
//       uploader: 'no_disponible'
//     },
//     title_corrections: {
//       admin: 'disponible',
//       optimizer: 'disponible',
//       reviewer: 'disponible',
//       youtuber: 'no_disponible',
//       uploader: 'no_disponible'
//     },
//     media_corrections: {
//       admin: 'disponible',
//       optimizer: 'no_disponible',
//       reviewer: 'no_disponible',
//       youtuber: 'disponible',
//       uploader: 'disponible'
//     },
//     upload_review: {
//       admin: 'disponible',
//       optimizer: 'no_disponible',
//       reviewer: 'no_disponible',
//       youtuber: 'disponible',
//       uploader: 'disponible'
//     },
//     youtube_ready: {
//       admin: 'disponible',
//       optimizer: 'no_disponible',
//       reviewer: 'no_disponible',
//       youtuber: 'disponible',
//       uploader: 'disponible'
//     },
//     completed: {
//       admin: 'disponible',
//       optimizer: 'no_disponible',
//       reviewer: 'no_disponible',
//       youtuber: 'disponible',
//       uploader: 'disponible'
//     }
//   };
//   return roleStatuses[status] || {};
// };

export const getRoleStatus = 1

export function useVideos(projectId?: number): {
  videos: Prisma.VideoGetPayload<{
    include: {
      currentReviewer: true
    }
  }>[];
  isLoading: boolean;
  createVideo: (video: Pick<Video, "title" | "description" | "projectId">) => Promise<any>;
  updateVideo: ({ videoId, projectId, data, currentRole, currentUser }: { videoId: number; projectId: number; data: UpdateVideoData;   currentRole: User['role']; currentUser?: any }) => Promise<any>;
  deleteVideo: ({videoId, projectId } : { videoId: number, projectId: number }) => Promise<any>;
} {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = projectId ? [`/api/projects/${projectId}/videos`] : ['/api/videos'];

  const { data: videos, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(queryKey[0], {
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error("Error al cargar los videos");
      }
      return res.json();
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
      toast({
        title: "Video creado",
        description: "El video se ha creado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el video",
        variant: "destructive",
      });
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({ videoId, projectId, data, currentRole, currentUser }: { videoId: number; projectId: number, data: UpdateVideoData; currentRole: User['role']; currentUser?: any }) => {
      if (data.status && videos) {
        const currentVideo = videos.find((v: Video) => v.id === videoId);
        if (currentVideo && !canUpdateVideoStatus(currentRole, currentVideo.status as VideoStatus, data.status)) {
          throw new Error("No tienes permiso para realizar esta transición de estado");
        }

        // Actualizar title_corrected cuando se pasa de title_corrections a optimize_review
        if (currentVideo?.status === 'title_corrections' && data.status === 'optimize_review') {
          console.log('Actualizando title_corrected a true');
          data = {
            ...data,
            title_corrected: true,
            status: 'optimize_review'
          };
        }

        // Actualizar media_corrected cuando se pasa de media_corrections a youtube_ready
        if (currentVideo?.status === 'media_corrections' && data.status === 'youtube_ready') {
          data = {
            ...data,
            media_corrected: true,
            status: 'youtube_ready'
          };
        }
      }

      console.log('Datos de actualización:', data);

      const res = await fetch(`/api/projects/${projectId}/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Error al actualizar el video");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Video actualizado",
        description: "El video se ha actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el video",
        variant: "destructive",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async ({videoId, projectId } : { videoId: number, projectId: number }) => {
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
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Video eliminado",
        description: "El video se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el video",
        variant: "destructive",
      });
    },
  });

  return {
    // videos: videos?.map((video: any) => (
    //   { 
    //     ...video, 
    //     effectiveStatus: getEffectiveStatus(video, localStorage.getItem('userRole'), JSON.parse(localStorage.getItem('currentUser') || '{}')) })) as Video[],
    videos,
    isLoading,
    createVideo: createVideoMutation.mutateAsync,
    updateVideo: updateVideoMutation.mutateAsync,
    deleteVideo: deleteVideoMutation.mutateAsync,
  };
}
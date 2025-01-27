
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Video, VideoStatus } from "@db/schema";
import { useToast } from "./use-toast";

// Tipos mejorados con estados más claros
export interface VideoMetadata {
  roleView?: {
    youtuber?: {
      status: 'disponible' | 'asignado' | 'completado' | 'correcciones_pendientes';
      lastAction?: {
        userId: number;
        username: string;
        timestamp: string;
        comments?: string;
      };
    };
    optimizer?: {
      status: 'disponible' | 'en_progreso' | 'revision_pendiente' | 'completado';
      currentTask?: 'titulo' | 'descripcion' | 'thumbnail' | 'video';
      assignedAt?: string;
      deadline?: string;
    };
    reviewer?: {
      status: 'disponible' | 'revision_en_progreso' | 'completado' | 'correcciones_necesarias';
      reviewType?: 'titulo' | 'contenido' | 'media';
      comments?: string;
      history?: {
        status: string;
        timestamp: string;
        userId: number;
        username: string;
        comments?: string;
      }[];
    };
    uploader?: {
      status: 'disponible' | 'subiendo' | 'verificando' | 'completado';
      uploadAttempts?: number;
      lastUpload?: string;
    };
  };
  currentAssignment?: {
    userId: number;
    role: string;
    assignedAt: string;
    expiresAt?: string;
  };
  statusHistory?: VideoStatus[];
}

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
  mediaCorrections?: MediaCorrections;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  metadata?: VideoMetadata;
}

const MAIN_STATUS_FLOW: Record<VideoStatus, VideoStatus[]> = {
  pending: ['in_progress', 'media_corrections'],
  in_progress: ['optimize_review', 'title_corrections', 'media_corrections'],
  title_corrections: ['in_progress', 'optimize_review'],
  optimize_review: ['youtube_ready', 'title_corrections', 'media_corrections'],
  media_corrections: ['upload_review', 'youtube_ready'],
  upload_review: ['youtube_ready', 'media_corrections'],
  youtube_ready: ['completed', 'upload_review'],
  review: [],
  completed: []
};

const ROLE_PERMISSIONS: Record<string, VideoStatus[]> = {
  optimizer: ['pending', 'in_progress', 'title_corrections', 'optimize_review'],
  reviewer: ['optimize_review', 'media_corrections', 'upload_review'],
  uploader: ['media_corrections', 'upload_review', 'youtube_ready'],
  admin: Object.keys(MAIN_STATUS_FLOW) as VideoStatus[]
};

export const validateStatusTransition = (
  currentStatus: VideoStatus,
  newStatus: VideoStatus,
  userRole: string
): boolean => {
  if (userRole === 'admin') return true;
  return STATUS_TRANSITIONS[userRole]?.[currentStatus]?.includes(newStatus) ?? false;
};

export const getRoleStatus = (video: Video, userRole?: string): string => {
  if (!userRole) return 'no_disponible';
  
  const roleStatus = video.metadata?.roleView?.[userRole as keyof VideoMetadata['roleView']];
  if (roleStatus && 'status' in roleStatus) {
    return roleStatus.status;
  }
  return 'no_disponible';
};

export const getEffectiveStatus = (
  video: Video,
  userRole?: string,
  userId?: number
): string => {
  if (!userRole) return 'no_disponible';

  if (video.metadata?.currentAssignment) {
    if (video.metadata.currentAssignment.userId === userId) {
      return 'asignado';
    }
    if (video.metadata.currentAssignment.role === userRole) {
      return 'en_uso';
    }
  }

  const roleStatus = video.metadata?.roleView?.[userRole as keyof VideoMetadata['roleView']];
  if (roleStatus && 'status' in roleStatus) {
    return roleStatus.status;
  }

  if (ROLE_PERMISSIONS[userRole]?.includes(video.status)) {
    return 'disponible';
  }

  return 'no_disponible';
};

export default function useVideos(projectId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = projectId ? [`/api/projects/${projectId}/videos`] : ['/api/videos'];

  const { data: videos, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(queryKey[0], { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar los videos");
      return res.json();
    },
    staleTime: 300_000,
    gcTime: 1_800_000,
  });

  const commonMutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Éxito", description: "Operación realizada correctamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error en la operación",
        variant: "destructive",
      });
    }
  };

  const createVideoMutation = useMutation({
    mutationFn: async (video: Pick<Video, "title" | "description" | "projectId">) => {
      const res = await fetch(`/api/projects/${video.projectId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(video),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    ...commonMutationOptions
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({
      videoId,
      data,
      userRole,
      userId
    }: {
      videoId: number;
      data: UpdateVideoData;
      userRole: string;
      userId?: number;
    }) => {
      const currentVideo = videos.find((v: Video) => v.id === videoId);
      
      if (data.status && currentVideo?.status) {
        if (!validateStatusTransition(currentVideo.status, data.status, userRole)) {
          throw new Error("Transición de estado no permitida");
        }
      }

      const res = await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    ...commonMutationOptions
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    ...commonMutationOptions
  });

  return {
    videos: videos?.map((video: Video) => ({
      ...video,
      effectiveStatus: getEffectiveStatus(
        video,
        localStorage.getItem('userRole') || undefined,
        Number(localStorage.getItem('userId'))
      )
    })),
    isLoading,
    error,
    createVideo: createVideoMutation.mutateAsync,
    updateVideo: updateVideoMutation.mutateAsync,
    deleteVideo: deleteVideoMutation.mutateAsync,
  };
}

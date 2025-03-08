import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Video } from '@db/schema'
import { toast } from "sonner";


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

export function useVideos(): {
  videos: ApiVideo[];
  isLoading: boolean;
  createVideo: (video: Pick<Video, "title" | "description" | "projectId">) => Promise<any>;
  createBulkVideos: ({ projectId, titles }: { projectId: number, titles: string[] }) => Promise<any>;
  updateVideo: ({ videoId, projectId, updateRequest }: { videoId: number; projectId: number; updateRequest: UpdateVideoData }) => Promise<any>;
  deleteVideo: ({videoId, projectId } : { videoId: number, projectId: number }) => Promise<any>;
  bulkDeleteVideos: ({projectId, videoIds} : { projectId: number, videoIds: number[] }) => Promise<any>;
} {
  const queryClient = useQueryClient();

  const queryKey = ['/api/videos']

  const { data: videos, isLoading } = useQuery<ApiVideo[]>({
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
  
  const createBulkVideosMutation = useMutation({
    mutationFn: async ({ projectId, titles }: { projectId: number, titles: string[] }) => {
      const res = await fetch(`/api/projects/${projectId}/videos/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titles }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Error al crear los videos en masa");
      }

      return res.json();
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
      toast.error("Error", {
        description: error.message || "No se pudieron crear los videos en masa",
      });
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({ videoId, projectId, updateRequest }: { videoId: number; projectId: number, updateRequest: UpdateVideoData }) => {
      

      console.log('Datos de actualización:', updateRequest);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
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
      toast.success("Video eliminado", {
        description: "El video se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message || "No se pudo eliminar el video",
      });
    },
  });

  const bulkDeleteVideosMutation = useMutation({
    mutationFn: async ({projectId, videoIds} : { projectId: number, videoIds: number[] }) => {
      const res = await fetch(`/api/projects/${projectId}/videos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Error al eliminar los videos en masa");
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Videos eliminados", {
        description: data.message || `Se han eliminado ${data.deleted || 0} videos correctamente`,
      });
    },
    onError: (error: Error) => {
      toast.error("Error", {
        description: error.message || "No se pudieron eliminar los videos en masa",
      });
    },
  });

  return {
    videos: videos ?? [],
    isLoading,
    createVideo: createVideoMutation.mutateAsync,
    createBulkVideos: createBulkVideosMutation.mutateAsync,
    updateVideo: updateVideoMutation.mutateAsync,
    deleteVideo: deleteVideoMutation.mutateAsync,
    bulkDeleteVideos: bulkDeleteVideosMutation.mutateAsync,
  };
}
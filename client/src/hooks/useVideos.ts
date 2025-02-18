import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { User, Video } from '@db/schema'


export type UpdateVideoData = Omit< Partial<Video>, 'id' | 'projectId' | 'lastReviewedAt' | 'updatedAt' >

export const getRoleStatus = 1

export type ApiVideo = {
  [K in keyof Video]: Video[K];
} & {
  reviewerName: User["fullName"] | null;
  reviewerUsername: User["username"];
  creatorName: User["fullName"] | null,
  creatorUsername: User["username"],
  optimizerName:User["fullName"] | null,
  optimizerUsername: User["username"]
}

export function useVideos(projectId?: number): {
  videos: ApiVideo[];
  isLoading: boolean;
  createVideo: (video: Pick<Video, "title" | "description" | "projectId">) => Promise<any>;
  updateVideo: ({ videoId, projectId, updateRequest }: { videoId: number; projectId: number; updateRequest: UpdateVideoData }) => Promise<any>;
  deleteVideo: ({videoId, projectId } : { videoId: number, projectId: number }) => Promise<any>;
} {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = projectId ? [`/api/projects/${projectId}/videos`] : ['/api/videos'];

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
    videos: videos ?? [],
    isLoading,
    createVideo: createVideoMutation.mutateAsync,
    updateVideo: updateVideoMutation.mutateAsync,
    deleteVideo: deleteVideoMutation.mutateAsync,
  };
}
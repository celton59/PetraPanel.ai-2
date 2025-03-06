import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ApiVideo } from "@/types";
import { Video } from "@db/schema";
import { toast } from "sonner";
import { PaginationMetadata } from "@/components/ui/pagination";

interface VideosResponse {
  videos: ApiVideo[];
  pagination: PaginationMetadata;
}

export function useVideos(page = 1, limit = 10, filters = {}) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<VideosResponse>({
    queryKey: ["/api/videos", page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Añadir parámetros de paginación
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      // Añadir filtros adicionales si existen
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.append(key, value.toString());
        }
      });

      const { data } = await axios.get<VideosResponse>(`/api/videos?${params.toString()}`);
      return data;
    },
  });

  // Extraer videos y metadatos de paginación
  const videos = data?.videos || [];
  const paginationMetadata = data?.pagination;

  const deleteVideo = useMutation(
    async (id: number) => {
      await axios.delete(`/api/videos/${id}`);
      await queryClient.invalidateQueries(["/api/videos"]);
      toast.success("Video eliminado correctamente");
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["/api/videos"]);
      },
    }
  );


  const updateVideo = useMutation(
    async (video: Partial<Video>) => {
      await axios.patch(`/api/videos/${video.id}`, video);
      await queryClient.invalidateQueries(["/api/videos"]);
      toast.success("Video actualizado correctamente");
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["/api/videos"]);
      },
    }
  );


  return {
    videos,
    paginationMetadata,
    isLoading,
    deleteVideo,
    updateVideo,
  };
}
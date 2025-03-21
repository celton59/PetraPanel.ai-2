import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface VideoStats {
  totalVideos: number;
  stateCounts: {
    upload_media: number;
    content_corrections: number;
    available: number;
    final_review: number;
  };
}

export function useVideoStats() {
  return useQuery<VideoStats>({
    queryKey: ["video-stats"],
    queryFn: async () => {
      console.log('Fetching video stats from /api/titulin/videos/stats');
      const { data } = await axios.get<VideoStats>('/api/titulin/videos/stats');
      console.log('Received video stats:', data);
      return data;
    },
    staleTime: 30000 // Refrescar cada 30 segundos
  });
}
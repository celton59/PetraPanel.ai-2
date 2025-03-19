import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface VideoStats {
  totalVideos: number;
  stateCounts: {
    available: number;
    completed: number;
    analyzed: number;
    pending_analysis: number;
  };
}

export function useVideoStats() {
  return useQuery({
    queryKey: ["video-stats"],
    queryFn: async () => {
      console.log('Fetching video stats...');
      const { data } = await axios.get<VideoStats>('/api/titulin/videos/stats');
      console.log('Received video stats:', data);
      return data;
    },
    staleTime: 30000, // Refrescar cada 30 segundos
  });
}
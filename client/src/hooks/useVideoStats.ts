import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface VideoStats {
  totalVideos: number;
  stateCounts: {
    [key: string]: number;
  };
}

export function useVideoStats() {
  return useQuery({
    queryKey: ["video-stats"],
    queryFn: async () => {
      const { data } = await axios.get<VideoStats>('/api/titulin/videos/stats');
      return data;
    }
  });
}

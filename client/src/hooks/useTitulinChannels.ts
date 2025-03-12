
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

export type YoutubeChannel = {
  id: number;
  channelId: string;
  name: string;
  active: boolean;
  lastVideoFetch: Date | null;
  videosCount: number;
};

export function useTitulinChannels() {
  const { data: channels = [], isLoading, isError, refetch } = useQuery<YoutubeChannel[]>({
    queryKey: ["titulin-channels"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/titulin/channels");
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching Titulin channels:', error);
        toast.error("Error al cargar los canales");
        return [];
      }
    },
  });

  return {
    channels,
    isLoading,
    isError,
    refetch
  };
}

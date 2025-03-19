import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { format, parseISO, isValid, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { YoutubeChannel, YoutubeVideo } from "@db/schema";


export type TitulinVideo = Omit<YoutubeVideo, 'publishedAt'> & {
  publishedAt?: string
}


export interface TitulinChannel extends Omit<YoutubeChannel, 'lastVideoFetch'> {
  lastVideoFetch?: string
}

export interface VideoResponse {
  videos: TitulinVideo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

export function useTitulin() {
  const [titleFilter, setTitleFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [onlyEvergreen, setOnlyEvergreen] = useState(false);
  const [onlyAnalyzed, setOnlyAnalyzed] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<TitulinVideo | null>(null);
  
  // Estados para paginación y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState("");

  // Obtener videos
  const { data: videosData, isLoading, isFetching, refetch: refetchVideos } = useQuery<VideoResponse>({
    queryKey: ["youtube-videos", channelFilter, currentPage, pageSize, titleFilter, onlyAnalyzed, onlyEvergreen],
    queryFn: async () => {
      // Parámetros de búsqueda simplificados
      const searchParams = {
        ...(channelFilter !== "all" ? { channelId: channelFilter } : {}),
        ...(titleFilter ? { title: titleFilter } : {}),
        ...(onlyEvergreen ? { isEvergreen: true } : {}),
        ...(onlyAnalyzed ? { analyzed: true } : {}),
        page: currentPage,
        limit: pageSize
      };
      
      console.log("Parámetros de búsqueda:", searchParams);
      
      const response = await axios.get<VideoResponse>("/api/titulin/videos", {
        params: searchParams
      });
      return response.data;
    },
    // Agregar opciones para mejorar la experiencia
    staleTime: 30000, // Datos frescos por 30 segundos
    refetchOnWindowFocus: false, // No recargar al cambiar de ventana
  });
  
  // Extraer videos y datos de paginación
  const videos = videosData?.videos || [];
  const pagination = videosData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };

  // Obtener canales
  const { data: channels, refetch: refetchChannels } = useQuery<TitulinChannel[]>({
    queryKey: ["youtube-channels"],
    queryFn: async () => {
      const response = await axios.get("/api/titulin/channels");
      return response.data;
    },
  });

  // Para estas estadísticas, necesitamos hacer una consulta adicional para obtener los totales
  const { data: statsData } = useQuery({
    queryKey: ["youtube-videos-stats"],
    queryFn: async () => {
      const response = await axios.get("/api/titulin/videos/stats");
      return response.data;
    },
  });
  
  const totalVideos = pagination.total || 0;
  const viewsCount = statsData?.totalViews || 0;
  const likesCount = statsData?.totalLikes || 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "-";
      return format(date, "PPp", { locale: es });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  const formatLastUpdate = (dateString?: string) => {
    if (!dateString) return "No hay datos";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "Fecha inválida";
      return `Hace ${formatDistanceToNow(date, { locale: es })}`;
    } catch (error) {
      console.error("Error formatting last update:", error);
      return "Error en fecha";
    }
  };

  const getLastUpdateInfo = () => {
    if (!channels || channels.length === 0) return "No hay canales";

    if (channelFilter !== "all") {
      const selectedChannel = channels.find(c => c.channelId === channelFilter);
      return selectedChannel ? formatLastUpdate(selectedChannel.lastVideoFetch) : "Canal no encontrado";
    }

    const lastUpdate = channels.reduce((latest: string | undefined, channel) => {
      if (!channel.lastVideoFetch) return latest;
      if (!latest) return channel.lastVideoFetch;
      return channel.lastVideoFetch > latest ? channel.lastVideoFetch : latest;
    }, undefined);

    return formatLastUpdate(lastUpdate);
  };

  const getChannelName = (channelId: string) => {
    const channel = channels?.find(c => c.channelId === channelId);
    return channel?.name || channelId;
  };

  // Descargar CSV
  const downloadCSVMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get("/api/titulin/videos", {
        params: {
          ...(channelFilter !== "all" ? { channelId: channelFilter } : {}),
          ...(titleFilter ? { title: titleFilter } : {}),
          limit: 1000, // Aumentamos el límite para exportar más videos
          page: 1
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      const exportVideos = data.videos || [];
      
      if (!exportVideos.length) {
        toast.error("No hay videos", {
          description: "No hay videos para descargar.",
        });
        return;
      }
      
      // Crear el contenido del CSV con los vídeos
      const titlesForCSV = exportVideos.map((video: TitulinVideo) => ({
        title: video.title,
        views: video.viewCount,
        likes: video.likeCount,
        published: formatDate(video.publishedAt),
        channel: getChannelName(video.channelId),
        duration: video.duration,
        isEvergreen: video.isEvergreen,
        url: `https://youtube.com/watch?v=${video.youtubeId}`
      }));
      
      // Convertir a formato CSV
      const headers = Object.keys(titlesForCSV[0]).join(',');
      const rows = titlesForCSV.map((obj: Record<string, any>) => 
        Object.values(obj).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      
      // Descargar como archivo
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `youtube_videos_export_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV generado", {
        description: `Se han exportado ${exportVideos.length} videos.`,
      });
    },
    onError: (error) => {
      console.error("Error downloading CSV:", error);
      toast.error("Error", {
        description: "No se pudo generar el archivo CSV.",
      });
    }
  });

  const handleDownloadCSV = () => {
    downloadCSVMutation.mutate();
  };

  // Limpia el filtro de búsqueda
  const handleClearSearch = () => {
    setTitleFilter("");
    setSearchValue("");
    setCurrentPage(1);
  };

  return {
    // Data
    titleFilter,
    channelFilter,
    selectedVideo,
    currentPage,
    pageSize,
    searchValue,
    videos,
    channels,
    pagination,
    totalVideos,
    viewsCount,
    likesCount,
    isLoading,
    isFetching,
    isDownloading: downloadCSVMutation.isPending,

    // Actions
    setTitleFilter,
    setChannelFilter,
    setSelectedVideo,
    setCurrentPage,
    setPageSize,
    setSearchValue,
    handleDownloadCSV,
    handleClearSearch,
    getLastUpdateInfo,
    getChannelName,
    setOnlyAnalyzed,
    setOnlyEvergreen,
    onlyEvergreen,
    onlyAnalyzed,
    refetch: () => {
      refetchVideos();
      refetchChannels();
    }
  };
}
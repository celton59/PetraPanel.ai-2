import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format, parseISO, isValid, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { TitulinVideo, Channel, VideoResponse } from "../types";

export function useTitulin() {
  const queryClient = useQueryClient();
  const [titleFilter, setTitleFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [selectedVideo, setSelectedVideo] = useState<TitulinVideo | null>(null);
  
  // Estados para paginación y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVowel, setSelectedVowel] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lista de vocales para búsqueda
  const vowels = ["a", "e", "i", "o", "u"];
  
  // Hook para obtener estadísticas de distribución de videos por vocal
  const { data: vowelStats } = useQuery({
    queryKey: ["youtube-videos-vowel-stats"],
    queryFn: async () => {
      const response = await axios.get("/api/titulin/videos/stats", {
        params: { type: "vowel-distribution" }
      });
      const data = response.data?.stats || {};
      
      // Asegurar que todas las vocales estén en el resultado aunque no tengan datos
      return vowels.reduce((acc, vowel) => {
        acc[vowel] = data[vowel] || 0;
        return acc;
      }, {} as Record<string, number>);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Función para obtener la primera vocal de una palabra
  const getFirstVowel = (text: string): string | null => {
    if (!text) return null;
    
    // Convertir a minúsculas y eliminar caracteres especiales
    const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Buscar la primera vocal en el texto
    for (let i = 0; i < normalized.length; i++) {
      if (vowels.includes(normalized[i])) {
        return normalized[i];
      }
    }
    
    return null;
  };
  
  // Efecto para manejar el debounce y la búsqueda por vocal
  useEffect(() => {
    // Limpiar cualquier timeout previo
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    const trimmedValue = searchValue.trim();
    const minSearchLength = 3;
    
    // Si hay una vocal seleccionada, la usamos como filtro principal
    if (selectedVowel && selectedVowel !== titleFilter) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        setTitleFilter(selectedVowel);
        setCurrentPage(1);
        setIsSearching(false);
      }, 100);
      return;
    }
    
    // Si no hay vocal seleccionada pero hay texto de búsqueda
    if (!selectedVowel && 
        trimmedValue !== titleFilter &&
        (trimmedValue.length >= minSearchLength || trimmedValue === '')) {
      
      setIsSearching(true);
      
      // Debounce para búsqueda normal
      searchTimeoutRef.current = setTimeout(() => {
        setTitleFilter(trimmedValue);
        setCurrentPage(1);
        setIsSearching(false);
      }, 350);
    }
    
    // Limpiar timeout al desmontar
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue, titleFilter, selectedVowel, setTitleFilter]);

  // Obtener videos
  const { data: videosData, isLoading, isFetching } = useQuery<VideoResponse>({
    queryKey: ["youtube-videos", channelFilter, currentPage, pageSize, titleFilter, selectedVowel],
    queryFn: async () => {
      // Determinar si estamos filtrando por vocal o por texto de búsqueda
      const searchParams = {
        ...(channelFilter !== "all" ? { channelId: channelFilter } : {}),
        ...(selectedVowel 
          ? { firstVowel: selectedVowel }  // Si hay una vocal seleccionada, usamos ese filtro
          : (titleFilter ? { title: titleFilter } : {})  // Si no, usamos el filtro de texto normal
        ),
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
  const { data: channels } = useQuery<Channel[]>({
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

  const formatDate = (dateString: string | null) => {
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

  const formatLastUpdate = (dateString: string | null) => {
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

    const lastUpdate = channels.reduce((latest, channel) => {
      if (!channel.lastVideoFetch) return latest;
      if (!latest) return channel.lastVideoFetch;
      return channel.lastVideoFetch > latest ? channel.lastVideoFetch : latest;
    }, null as string | null);

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
          ...(selectedVowel ? { firstVowel: selectedVowel } : (titleFilter ? { title: titleFilter } : {})),
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
        isEvergreen: video.analyzed && video.analysisData ? (video.analysisData.isEvergreen ? "Sí" : "No") : "No analizado",
        url: `https://youtube.com/watch?v=${video.videoId}`
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

  const handleClearVowelFilter = () => {
    setSelectedVowel(null);
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
    isSearching,
    selectedVowel,
    vowels,
    vowelStats,
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
    setSelectedVowel,
    handleDownloadCSV,
    handleClearVowelFilter,
    getLastUpdateInfo,
    getChannelName,
    getFirstVowel
  };
}
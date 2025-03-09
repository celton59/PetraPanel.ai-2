import { Youtube } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { VideoStats } from "./components/VideoStats";
import { SearchBar } from "./components/SearchBar";
import { TableActions } from "./components/TableActions";
import { VideoTable } from "./components/VideoTable";
import { PaginationControls } from "./components/PaginationControls";
import { SendToOptimizeDialog } from "./components/SendToOptimizeDialog";
import { VideoAnalysisDialog } from "./components/VideoAnalysisDialog";
import { TitulinVideo, Channel, VideoResponse } from "./types";
import { format, parseISO, isValid, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export default function TitulinPage() {
  // Estados de la página
  const [searchValue, setSearchValue] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<TitulinVideo | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<TitulinVideo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [isSearching, setIsSearching] = useState(false);

  // Efecto para gestionar la búsqueda
  useEffect(() => {
    const timerId = setTimeout(() => {
      setTitleFilter(searchValue.trim());
      setCurrentPage(1);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchValue]);

  // Obtener el queryClient para poder usarlo más tarde
  const queryClient = useQueryClient();

  // Consulta para obtener videos
  const { 
    data: videosData, 
    isLoading, 
    isFetching 
  } = useQuery<VideoResponse>({
    queryKey: ["youtube-videos", channelFilter, currentPage, pageSize, titleFilter],
    queryFn: async () => {
      const searchParams = {
        ...(channelFilter !== "all" ? { channelId: channelFilter } : {}),
        ...(titleFilter ? { title: titleFilter } : {}),
        page: currentPage,
        limit: pageSize
      };
      
      console.log("Parámetros de búsqueda:", searchParams);
      
      const response = await axios.get<VideoResponse>("/api/titulin/videos", {
        params: searchParams
      });
      return response.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Obtener canales
  const { data: channels } = useQuery<Channel[]>({
    queryKey: ["youtube-channels"],
    queryFn: async () => {
      const response = await axios.get("/api/titulin/channels");
      return response.data;
    },
  });

  // Obtener estadísticas
  const { data: statsData } = useQuery({
    queryKey: ["youtube-videos-stats"],
    queryFn: async () => {
      const response = await axios.get("/api/titulin/videos/stats");
      return response.data;
    },
  });

  // Función para formatear fechas
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

  // Obtener la información de la última actualización
  const getLastUpdateInfo = () => {
    if (!channels || channels.length === 0) return "No hay canales";

    if (channelFilter !== "all") {
      const selectedChannel = channels.find(c => c.channelId === channelFilter);
      if (!selectedChannel?.lastVideoFetch) return "Sin datos de actualización";
      
      try {
        const date = parseISO(selectedChannel.lastVideoFetch);
        return `Hace ${formatDistanceToNow(date, { locale: es })}`;
      } catch (error) {
        return "Fecha inválida";
      }
    }

    const lastUpdate = channels.reduce((latest, channel) => {
      if (!channel.lastVideoFetch) return latest;
      if (!latest) return channel.lastVideoFetch;
      return channel.lastVideoFetch > latest ? channel.lastVideoFetch : latest;
    }, null as string | null);

    if (!lastUpdate) return "No hay datos";
    
    try {
      const date = parseISO(lastUpdate);
      return `Hace ${formatDistanceToNow(date, { locale: es })}`;
    } catch (error) {
      return "Fecha inválida";
    }
  };

  // Obtener el nombre de un canal
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
          limit: 1000,
          page: 1
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      const exportVideos = data.videos || [];
      
      if (!exportVideos.length) {
        toast.error("No hay videos para descargar");
        return;
      }
      
      // Crear el contenido del CSV
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
      
      toast.success(`Se han exportado ${exportVideos.length} videos`);
    },
    onError: (error) => {
      console.error("Error downloading CSV:", error);
      toast.error("No se pudo generar el archivo CSV");
    }
  });

  // Handler para descargar CSV
  const handleDownloadCSV = () => {
    downloadCSVMutation.mutate();
  };

  // Extraer datos
  const videos = videosData?.videos || [];
  const pagination = videosData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };
  const totalVideos = pagination.total || 0;
  const viewsCount = statsData?.totalViews || 0;
  const likesCount = statsData?.totalLikes || 0;
  const isDownloading = downloadCSVMutation.isPending;

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Youtube className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Videos de YouTube</h1>
          </div>

          <VideoStats 
            totalVideos={totalVideos}
            viewsCount={viewsCount}
            likesCount={likesCount}
            lastUpdateInfo={getLastUpdateInfo()}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="relative flex-1 w-full">
                  {/* Barra de búsqueda simplificada */}
                  <SearchBar 
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    setTitleFilter={setTitleFilter}
                    setCurrentPage={setCurrentPage}
                    isFetching={isFetching}
                  />
                </div>

                {/* Selector de canal y botón de exportar */}
                <TableActions
                  channelFilter={channelFilter}
                  setChannelFilter={setChannelFilter}
                  setCurrentPage={setCurrentPage}
                  channels={channels}
                  handleDownloadCSV={handleDownloadCSV}
                  isDownloading={isDownloading}
                />
              </div>
            </div>
          </div>

          {/* Estado de carga */}
          {isLoading && (
            <div className="text-center py-10">
              <div className="animate-spin h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando videos...</p>
            </div>
          )}
          
          {/* Tabla de videos */}
          {!isLoading && (
            <>
              <VideoTable
                videos={videos}
                setSelectedVideo={setSelectedVideo}
                setAnalysisVideo={setAnalysisVideo}
                getChannelName={getChannelName}
              />

              {/* Paginación */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                setCurrentPage={setCurrentPage}
              />
            </>
          )}
        </motion.div>

        {/* Modal para enviar video a optimización */}
        {selectedVideo && (
          <SendToOptimizeDialog
            video={selectedVideo}
            open={!!selectedVideo}
            onOpenChange={(open) => {
              if (!open) setSelectedVideo(null);
            }}
          />
        )}

        {/* Modal para análisis de video */}
        {analysisVideo && (
          <VideoAnalysisDialog
            video={analysisVideo}
            open={!!analysisVideo}
            onOpenChange={(open) => {
              if (!open) setAnalysisVideo(null);
            }}
            onAnalysisComplete={() => {
              // Invalidar la consulta para actualizar los datos
              window.setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
              }, 500);
            }}
          />
        )}
      </div>
    </div>
  );
}
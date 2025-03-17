import { TitulinVideo } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, Award, ExternalLink } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

interface MobileVideoListProps {
  videos: TitulinVideo[];
  setSelectedVideo: (video: TitulinVideo) => void;
  setAnalysisVideo?: (video: TitulinVideo) => void;
  getChannelName: (channelId: string) => string;
  isLoading?: boolean;
}

export function MobileVideoList({
  videos,
  setSelectedVideo,
  setAnalysisVideo,
  getChannelName,
  isLoading = false,
}: MobileVideoListProps) {
  const queryClient = useQueryClient();

  // Formatear fecha ISO a una fecha legible
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "-";
      return format(date, "PP", { locale: es });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  // Formatear números con separadores de miles
  const formatNumber = (num: number | string | null) => {
    if (num === null || num === undefined) return "0";
    return Number(num).toLocaleString();
  };

  // Mutación para analizar si un video es evergreen
  const analyzeEvergeenMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await axios.post(`/api/titulin/videos/${videoId}/analyze`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
      toast.success("Análisis completado", {
        description: "El video ha sido analizado correctamente"
      });
    },
    onError: (error) => {
      console.error("Error analyzing video:", error);
      toast.error("Error", {
        description: "No se pudo analizar el video",
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
      </div>
    );
  }
  
  if (videos.length === 0) {
    return (
      <div className="p-6 text-center border rounded-lg">
        <p className="text-muted-foreground">No se encontraron videos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <div 
          key={video.id} 
          className="p-4 border rounded-lg bg-card shadow-sm"
        >
          <div className="flex gap-3">
            {/* Miniatura del video */}
            <div className="w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/120x90?text=No+Image";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No img
                </div>
              )}
            </div>
            
            {/* Información del video */}
            <div className="flex-1 min-w-0">
              {/* Título con badge si fue enviado a optimizar */}
              <h3 className="font-medium text-sm leading-tight mb-1 truncate" title={video.title}>
                {video.title}
              </h3>
              
              {video.sentToOptimize && (
                <Badge variant="secondary" className="mb-2">
                  Enviado a optimizar
                </Badge>
              )}
              
              {/* Estadísticas en dos columnas */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Canal:</span>
                  <span className="truncate">{getChannelName(video.channelId)}</span>
                </div>
                <div>
                  <span className="font-medium">Vistas:</span> {formatNumber(video.viewCount)}
                </div>
                <div>
                  <span className="font-medium">Fecha:</span> {formatDate(video.publishedAt || video['published_at'])}
                </div>
                <div>
                  <span className="font-medium">Likes:</span> {formatNumber(video.likeCount)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección de estado evergreen y acciones */}
          <div className="mt-3 flex flex-col gap-2">
            {/* Estado Evergreen */}
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">Estado:</div>
              {!video.analyzed ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => analyzeEvergeenMutation.mutate(video.id)}
                  disabled={analyzeEvergeenMutation.isPending}
                  className="h-8"
                >
                  {analyzeEvergeenMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  ) : (
                    <PlayCircle className="h-3.5 w-3.5 mr-2" />
                  )}
                  Analizar
                </Button>
              ) : !video.analysisData ? (
                <Badge variant="outline" className="text-muted-foreground px-2 py-1 h-7">
                  Analizado (sin datos)
                </Badge>
              ) : (
                <Badge variant={video.analysisData.isEvergreen ? "default" : "secondary"} className="px-2 py-1 h-7">
                  {video.analysisData.isEvergreen ? (
                    <span className="flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      Evergreen ({Math.round(video.analysisData.confidence * 100)}%)
                    </span>
                  ) : (
                    <span>No Evergreen ({Math.round(video.analysisData.confidence * 100)}%)</span>
                  )}
                </Badge>
              )}
            </div>
            
            {/* Acciones */}
            <div className="grid grid-cols-2 gap-2">
              {setAnalysisVideo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAnalysisVideo(video)}
                  className="h-8"
                >
                  <PlayCircle className="h-3.5 w-3.5 mr-2" />
                  Análisis
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVideo(video)}
                disabled={video.sentToOptimize}
                className="h-8"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                {video.sentToOptimize ? "Ya enviado" : "Optimizar"}
              </Button>
            </div>
            
            {/* Enlace a YouTube */}
            <a 
              href={`https://youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-center text-muted-foreground hover:text-primary transition-colors mt-1"
            >
              Ver en YouTube
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
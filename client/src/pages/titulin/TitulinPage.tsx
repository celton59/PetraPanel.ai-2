import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Youtube, PlayCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation as useWouterLocation } from "wouter";
import { format, parseISO, isValid, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { Project } from "@db/schema";
import { DataTable } from "./DataTable";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";


interface TitulinVideo {
  id: number;
  videoId: string;
  channelId: string;
  title: string;
  description: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string | null;
  tags: string[] | null;
  analyzed: boolean;
  sentToOptimize: boolean;
  sentToOptimizeAt: string | null;
  sentToOptimizeProjectId: number | null;
  analysisData: {
    isEvergreen: boolean;
    confidence: number;
    reason: string;
  } | null;
}

interface Channel {
  id: number;
  channelId: string;
  name: string;
  lastVideoFetch: string | null;
}



export default function TitulinPage() {
  const queryClient = useQueryClient();
  const [titleFilter, setTitleFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [selectedVideo, setSelectedVideo] = useState<TitulinVideo | null>(null);

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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // Este timeout es para hacer debounce del filtro de título
  const [titleFilterTimeout, setTitleFilterTimeout] = useState<NodeJS.Timeout | null>(null);

  const { data: videosData, isLoading } = useQuery({
    queryKey: ["youtube-videos", channelFilter, currentPage, pageSize, titleFilter],
    queryFn: async () => {
      const response = await axios.get("/api/titulin/videos", {
        params: {
          ...(channelFilter !== "all" ? { channelId: channelFilter } : {}),
          ...(titleFilter ? { title: titleFilter } : {}),
          page: currentPage,
          limit: pageSize
        }
      });
      return response.data;
    },
  });
  
  // Extraer videos y datos de paginación
  const videos = videosData?.videos || [];
  const pagination = videosData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };

  const { data: channels } = useQuery<Channel[]>({
    queryKey: ["youtube-channels"],
    queryFn: async () => {
      const response = await axios.get("/api/titulin/channels");
      return response.data;
    },
  });

  // Ya no es necesario filtrar en el cliente porque el filtrado se hace en el servidor
  const filteredVideos = videos || [];

  // Calculate statistics
  const totalVideos = pagination.total || 0;
  
  // Para estas estadísticas, necesitamos hacer una consulta adicional para obtener los totales de toda la colección
  const { data: statsData } = useQuery({
    queryKey: ["youtube-videos-stats"],
    queryFn: async () => {
      const response = await axios.get("/api/titulin/videos/stats");
      return response.data;
    },
  });
  
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

  const formatDuration = (duration: string | null) => {
    if (!duration) return "-";

    try {
      const hours = duration.match(/(\d+)H/)?.[1];
      const minutes = duration.match(/(\d+)M/)?.[1];
      const seconds = duration.match(/(\d+)S/)?.[1];

      const h = parseInt(hours || "0");
      const m = parseInt(minutes || "0");
      const s = parseInt(seconds || "0");

      if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
      }
      if (m > 0) {
        return `${m}:${s.toString().padStart(2, "0")}`;
      }
      return `0:${s.toString().padStart(2, "0")}`;
    } catch (error) {
      console.error("Error formatting duration:", error);
      return "-";
    }
  };

  const getChannelName = (channelId: string) => {
    const channel = channels?.find(c => c.channelId === channelId);
    return channel?.name || channelId;
  };

  const columns: ColumnDef<TitulinVideo>[] = [
    {
      accessorKey: "thumbnailUrl",
      header: "Miniatura",
      cell: ({ row }) => (
        <div className="w-24 h-16 bg-muted rounded overflow-hidden">
          {row.original.thumbnailUrl ? (
            <img
              src={row.original.thumbnailUrl}
              alt={row.original.title}
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
      ),
    },
    {
      accessorKey: "title",
      header: "Título",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate" title={row.original.title}>
          {row.original.title}
          {row.original.sentToOptimize && (
            <Badge variant="secondary" className="ml-2">
              Enviado a optimizar
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "viewCount",
      header: "Vistas",
      cell: ({ row }) => (
        <span>{Number(row.original.viewCount || 0).toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "likeCount",
      header: "Likes",
      cell: ({ row }) => (
        <span>{Number(row.original.likeCount || 0).toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "publishedAt",
      header: "Publicado",
      cell: ({ row }) => (
        <span>{formatDate(row.original.publishedAt)}</span>
      ),
    },
    {
      accessorKey: "duration",
      header: "Duración",
      cell: ({ row }) => (
        <span>{formatDuration(row.original.duration)}</span>
      ),
    },
    {
      accessorKey: "channelId",
      header: "Canal",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          {getChannelName(row.original.channelId)}
        </div>
      ),
    },
    {
      accessorKey: "analysisData",
      header: "Evergreen",
      cell: ({ row }) => {
        const video = row.original;

        if (!video.analyzed) {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => analyzeEvergeenMutation.mutate(video.id)}
              disabled={analyzeEvergeenMutation.isPending}
              className="w-full"
            >
              {analyzeEvergeenMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              Analizar
            </Button>
          );
        }

        if (!video.analysisData) {
          // El video está analizado pero no tenemos los datos de análisis
          // Esto puede ocurrir con la versión actual del esquema de base de datos
          return (
            <div className="space-y-1">
              <Badge variant="outline" className="text-muted-foreground">
                Analizado
              </Badge>
              <div className="text-xs text-muted-foreground">
                Datos no disponibles
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-1">
            <Badge variant={video.analysisData.isEvergreen ? "default" : "secondary"}>
              {video.analysisData.isEvergreen ? "Evergreen" : "No Evergreen"}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {Math.round(video.analysisData.confidence * 100)}% confianza
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const video = row.original;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedVideo(video)}
            className="w-full"
            disabled={video.sentToOptimize}
          >
            {video.sentToOptimize ? "Ya enviado" : "Enviar a Optimización"}
          </Button>
        );
      }
    }
  ];

  // Ya no necesitamos una consulta separada para todos los videos
  // Usamos una mutación directamente para obtener todos los videos al hacer clic en descargar
  
  const downloadCSVMutation = useMutation({
    mutationFn: async () => {
      // Hacer solicitud al servidor para obtener todos los videos con los filtros actuales
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
        isEvergreen: video.analyzed 
          ? (video.analysisData?.isEvergreen ? "Sí" : video.analysisData === null ? "Desconocido" : "No") 
          : "Sin analizar",
        confidence: video.analysisData 
          ? `${Math.round(video.analysisData.confidence * 100)}%` 
          : (video.analyzed ? "Datos no disponibles" : "N/A")
      }));
      
      const headers = ["Título", "Vistas", "Likes", "Fecha de Publicación", "Canal", "Evergreen", "Confianza"];
      
      // Agregar BOM para UTF-8
      const BOM = '\uFEFF';
      const csvContent = BOM + [
        headers.join(";"),  // Usar punto y coma como separador
        ...titlesForCSV.map((row: any) => [
          `"${row.title.replace(/"/g, '""')}"`, // Escapar comillas dobles
          row.views,
          row.likes,
          `"${row.published}"`,
          `"${row.channel.replace(/"/g, '""')}"`,
          `"${row.isEvergreen}"`,
          `"${row.confidence}"`
        ].join(";"))
      ].join("\n");
      
      // Crear el blob especificando UTF-8
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", "titulos_titulin.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Liberar memoria
      
      toast.success("CSV descargado", {
        description: `Se exportaron ${exportVideos.length} videos.`
      });
    },
    onError: (error) => {
      console.error("Error downloading CSV:", error);
      toast.error("Error", {
        description: "No se pudo descargar el CSV",
      });
    }
  });
  
  const handleDownloadCSV = () => {
    downloadCSVMutation.mutate();
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 shadow-sm">
              <div className="text-2xl font-bold text-primary">{totalVideos}</div>
              <div className="text-sm text-muted-foreground">Videos Totales</div>
            </Card>
            <Card className="p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{viewsCount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Vistas Totales</div>
            </Card>
            <Card className="p-4 shadow-sm">
              <div className="text-2xl font-bold text-yellow-500">{likesCount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Likes Totales</div>
            </Card>
            <Card className="p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-500">{getLastUpdateInfo()}</div>
              <div className="text-sm text-muted-foreground">Última Actualización</div>
            </Card>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título..."
                value={titleFilter}
                onChange={(e) => {
                  // Aplicamos debounce para evitar muchas peticiones
                  if (titleFilterTimeout) clearTimeout(titleFilterTimeout);
                  const timeout = setTimeout(() => {
                    setTitleFilter(e.target.value);
                    setCurrentPage(1); // Volver a la primera página al cambiar el filtro
                  }, 500);
                  setTitleFilterTimeout(timeout);
                }}
                className="pl-8"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadCSV}
                className="flex items-center gap-2"
                disabled={!videos?.length}
              >
                <Download className="h-4 w-4" />
                Descargar CSV
              </Button>

              <Select
                value={channelFilter}
                onValueChange={setChannelFilter}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filtrar por canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los canales</SelectItem>
                  {channels?.map((channel) => (
                    <SelectItem key={channel.id} value={channel.channelId}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable columns={columns} data={filteredVideos} />
          
          {/* Paginación */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Mostrando {videos.length} de {pagination.total} videos
            </div>
            
            <div className="flex items-center gap-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = currentPage > 3 && pagination.totalPages > 5
                      ? currentPage - 3 + i
                      : i + 1;
                    
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <Button
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          className="w-9"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      </PaginationItem>
                    );
                  })}
                  
                  {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
                    <>
                      <PaginationItem>
                        <span className="mx-1">...</span>
                      </PaginationItem>
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-9"
                          onClick={() => setCurrentPage(pagination.totalPages)}
                        >
                          {pagination.totalPages}
                        </Button>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={currentPage >= pagination.totalPages}
                    >
                      Siguiente
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filas por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="20">20 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                  <SelectItem value="100">100 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SendToOptimizeDialog
            video={selectedVideo!}
            open={!!selectedVideo}
            onOpenChange={(open) => !open && setSelectedVideo(null)}
          />
        </motion.div>
      </div>
    </div>
  );
}


interface SendToOptimizeDialogProps {
  video: TitulinVideo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SendToOptimizeDialog({ video, open, onOpenChange }: SendToOptimizeDialogProps) {
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useWouterLocation();

  const handleSubmit = async () => {
    if (!selectedProject) {
      toast.error("Error", {        
        description: "Debes seleccionar un proyecto",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Enviar a optimización
      const response = await axios.post("/api/videos", {
        projectId: selectedProject,
        title: video.title,
        description: video.description,
        youtubeId: video.videoId,
        sourceId: video.id
      });

      // Marcar como enviado a optimización
      await axios.post(`/api/titulin/videos/${video.id}/sent-to-optimize`, {
        projectId: selectedProject
      });

      toast.success("Éxito", {
        description: "Video enviado a optimización"
      });

      onOpenChange(false);
      setLocation("/videos");
    } catch (error) {
      console.error("Error sending video to optimization:", error);
      toast.error("Error", {
        description: "No se pudo enviar el video a optimización",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar a Optimización</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Selecciona un proyecto</h3>
            <p className="text-sm text-muted-foreground">
              El video será optimizado dentro del proyecto seleccionado
            </p>
          </div>
          <ProjectSelector
            value={selectedProject?.id ?? null}
            onChange={setSelectedProject}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedProject || isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

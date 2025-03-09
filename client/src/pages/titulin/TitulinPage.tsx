import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Youtube, PlayCircle, X, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation as useWouterLocation } from "wouter";
import { format, parseISO, isValid, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
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
  
  // Estados para paginación y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVowel, setSelectedVowel] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lista de vocales para búsqueda
  const vowels = ["a", "e", "i", "o", "u"];
  
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

  // Definir el tipo explícitamente para evitar errores de TS
  interface VideoResponse {
    videos: TitulinVideo[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
  
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

  // Función para limpiar la búsqueda por vocal
  const handleClearVowelFilter = () => {
    setSelectedVowel(null);
    setTitleFilter("");
    setSearchValue("");
    setCurrentPage(1);
  };

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
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <div className="space-y-3">
                  <div className="relative">
                    <Input
                      placeholder="Buscar por título en los 6492 videos..."
                      value={searchValue}
                      onChange={(e) => {
                        setSearchValue(e.target.value);
                        // Al empezar a escribir, desactivamos la selección de vocal
                        if (selectedVowel && e.target.value) {
                          setSelectedVowel(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const currentValue = searchValue.trim();
                          if (currentValue !== titleFilter && (currentValue.length >= 3 || currentValue === '')) {
                            // Búsqueda inmediata con Enter
                            setIsSearching(true);
                            setTitleFilter(currentValue);
                            setCurrentPage(1);
                            setSelectedVowel(null); // Desactivar filtro por vocal
                            // Reset del estado de búsqueda después de aplicar
                            setTimeout(() => setIsSearching(false), 100);
                          }
                        }
                      }}
                      aria-label="Buscar videos"
                      className={`pl-8 transition-all ${isSearching ? 'pr-10 bg-muted/30' : ''}`}
                      disabled={isSearching || isFetching}
                    />
                    {(isSearching || isFetching) && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Filtro por primera vocal */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">Filtrar por primera vocal:</span>
                    
                    <div className="flex gap-1">
                      {vowels.map((vowel) => (
                        <Button
                          key={vowel}
                          variant={selectedVowel === vowel ? "default" : "outline"}
                          size="sm"
                          className={`h-8 w-8 p-0 ${selectedVowel === vowel ? 'bg-primary text-primary-foreground' : ''}`}
                          onClick={() => {
                            if (selectedVowel === vowel) {
                              // Si ya está seleccionada, deseleccionamos
                              setSelectedVowel(null);
                              setTitleFilter(""); // Limpiar filtro de título también
                            } else {
                              // Seleccionar esta vocal
                              setSelectedVowel(vowel);
                              setSearchValue(""); // Limpiar campo de búsqueda
                            }
                            setCurrentPage(1); // Resetear página
                          }}
                          disabled={isSearching || isFetching}
                        >
                          {vowel.toUpperCase()}
                        </Button>
                      ))}
                      
                      {selectedVowel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground"
                          onClick={handleClearVowelFilter}
                          disabled={isSearching || isFetching}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={channelFilter}
                    onValueChange={(value) => {
                      setChannelFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-10 min-w-[220px]">
                      <SelectValue placeholder="Filtrar por canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los canales</SelectItem>
                      {channels?.map((channel) => (
                        <SelectItem key={channel.channelId} value={channel.channelId}>
                          {channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={handleDownloadCSV}
                    disabled={downloadCSVMutation.isPending}
                    className="h-10"
                    aria-label="Descargar CSV"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Exportar</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <DataTable
              columns={columns}
              data={filteredVideos}
            />
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                        }
                      }}
                      aria-disabled={currentPage <= 1}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {/* Generar los elementos de paginación */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    // Mostrar siempre la primera página, la última y las que rodean a la actual
                    let pageToShow = i + 1;
                    
                    if (pagination.totalPages > 5) {
                      if (currentPage <= 3) {
                        // Estamos cerca del inicio, mostrar las primeras páginas
                        pageToShow = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        // Estamos cerca del final, mostrar las últimas páginas
                        pageToShow = pagination.totalPages - 4 + i;
                      } else {
                        // Estamos en el medio, mostrar páginas alrededor de la actual
                        pageToShow = currentPage - 2 + i;
                      }
                    }
                    
                    return (
                      <PaginationItem key={pageToShow}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageToShow);
                          }}
                          isActive={currentPage === pageToShow}
                        >
                          {pageToShow}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < pagination.totalPages) {
                          setCurrentPage(currentPage + 1);
                        }
                      }}
                      aria-disabled={currentPage >= pagination.totalPages}
                      className={currentPage >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
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
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [_location, navigate] = useWouterLocation();

  const sendToOptimizeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/api/titulin/videos/${video.id}/send-to-optimize`, {
        projectId: selectedProject
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
      onOpenChange(false); // Cerrar el diálogo
      
      toast.success("Video enviado a optimización", {
        description: "El video ha sido enviado al proyecto seleccionado"
      });
      
      // Redirigir a la página de videos
      if (data.videoId) {
        // Breve retraso para dar tiempo a que se cierre el modal
        setTimeout(() => {
          navigate(`/videos?videoId=${data.videoId}`);
        }, 500);
      }
    },
    onError: (error) => {
      console.error("Error sending video to optimize:", error);
      toast.error("Error", {
        description: "No se pudo enviar el video a optimización",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar video a optimización</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <h3 className="font-semibold">Título del video</h3>
            <p className="text-sm">{video.title}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Canal</h3>
            <p className="text-sm">{video.channelId}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Proyecto destino</h3>
            <ProjectSelector
              value={selectedProject}
              onChange={setSelectedProject}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => sendToOptimizeMutation.mutate()}
              disabled={!selectedProject || sendToOptimizeMutation.isPending}
            >
              {sendToOptimizeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : "Enviar a optimización"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
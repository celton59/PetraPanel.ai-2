
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
import { format, parseISO, isValid, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { YoutubeChannel, YoutubeVideo } from "@db/schema";
import { DataTable } from "./DataTable";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

// Interfaz para los datos de paginación
interface PaginationMetadata {
  page: number;
  limit: number;
  totalVideos: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Interfaz para la respuesta del servidor
interface VideosResponse {
  videos: YoutubeVideo[];
  pagination: PaginationMetadata;
}

export default function TitulinPage() {
  const queryClient = useQueryClient();
  const [titleFilter, setTitleFilter] = useState("");
  const [channelFilter, setYoutubeChannelFilter] = useState<string>("all");
  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<number | null>(null);
  
  // Estado para la paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationMetadata, setPaginationMetadata] = useState<PaginationMetadata | null>(null);

  // Consultar canales
  const { data: channels } = useQuery({
    queryKey: ["youtube-channels"],
    queryFn: async () => {
      const { data } = await axios.get<YoutubeChannel[]>("/api/titulin/channels");
      return data;
    },
  });

  // Consultar videos con paginación
  const {
    data: videosData,
    isLoading: isLoadingVideos,
    isFetching: isFetchingVideos,
  } = useQuery({
    queryKey: ["youtube-videos", channelFilter, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Añadir parámetros de paginación
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      
      // Añadir filtro de canal si es necesario
      if (channelFilter !== "all") {
        params.append("channelId", channelFilter);
      }

      const { data } = await axios.get<VideosResponse>(`/api/titulin/videos?${params.toString()}`);
      
      // Guardar los metadatos de paginación
      setPaginationMetadata(data.pagination);
      
      return data;
    },
  });

  const videos = videosData?.videos || [];

  // Mutación para enviar video a optimizar
  const sendToOptimize = useMutation({
    mutationFn: async ({ videoId, projectId }: { videoId: number; projectId: number }) => {
      const { data } = await axios.post(`/api/titulin/videos/${videoId}/send-to-optimize`, {
        projectId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });

      toast.success("¡Video enviado a optimizar con éxito!");
      setSelectedVideo(null);
    },
    onError: (error) => {
      console.error("Error al enviar a optimizar:", error);
      toast.error("Error al enviar el video a optimizar");
    },
  });

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(titleFilter.toLowerCase())
  );

  const columns: ColumnDef<YoutubeVideo>[] = [
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
      header: "Publicación",
      cell: ({ row }) => {
        const date = row.original.publishedAt
          ? parseISO(row.original.publishedAt.toString())
          : null;

        return date && isValid(date) ? (
          <span title={format(date, "PPP", { locale: es })}>
            {formatDistanceToNow(date, { addSuffix: true, locale: es })}
          </span>
        ) : (
          <span>Desconocido</span>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedVideo(row.original)}
          >
            <PlayCircle className="h-4 w-4 mr-1" />
            Detalles
          </Button>
        </div>
      ),
    },
  ];

  function handlePageChange(newPage: number) {
    if (newPage >= 1 && (!paginationMetadata || newPage <= paginationMetadata.totalPages)) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  }

  function renderPaginationItems() {
    if (!paginationMetadata) return null;
    
    const { page: currentPage, totalPages } = paginationMetadata;
    const items = [];
    
    // Siempre mostrar la primera página
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          isActive={currentPage === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Si hay muchas páginas, mostrar elipsis después de la primera página
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Mostrar páginas alrededor de la página actual
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i <= 1 || i >= totalPages) continue;
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Si hay muchas páginas, mostrar elipsis antes de la última página
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Siempre mostrar la última página si hay más de una página
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            isActive={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  }

  function handleSendToOptimize() {
    if (!selectedVideo || !targetProjectId) {
      toast.error("Selecciona un proyecto válido");
      return;
    }

    sendToOptimize.mutate({
      videoId: selectedVideo.id,
      projectId: targetProjectId,
    });
  }

  // Función para renderizar el diálogo de detalle de video
  function renderVideoDialog () {
    if (!selectedVideo) return null;

    return (
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedVideo.title}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {selectedVideo.thumbnailUrl ? (
                  <img
                    src={selectedVideo.thumbnailUrl.replace('default', 'maxresdefault')}
                    alt={selectedVideo.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = selectedVideo.thumbnailUrl || "https://via.placeholder.com/640x360?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No preview available
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://youtube.com/watch?v=${selectedVideo.youtubeId}`, '_blank')}
                >
                  <Youtube className="h-4 w-4 mr-2" />
                  Ver en YouTube
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Descripción
                </h3>
                <div className="text-sm border rounded-md p-3 h-[150px] overflow-y-auto whitespace-pre-line">
                  {selectedVideo.description || "Sin descripción"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Vistas
                  </h3>
                  <p>{Number(selectedVideo.viewCount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Likes
                  </h3>
                  <p>{Number(selectedVideo.likeCount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Comentarios
                  </h3>
                  <p>
                    {Number(selectedVideo.commentCount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Publicado
                  </h3>
                  <p>
                    {selectedVideo.publishedAt
                      ? format(new Date(selectedVideo.publishedAt), "dd/MM/yyyy")
                      : "Desconocido"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Etiquetas
                </h3>
                <div className="flex flex-wrap gap-1">
                  {selectedVideo.tags && selectedVideo.tags.length > 0 ? (
                    selectedVideo.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Sin etiquetas
                    </span>
                  )}
                </div>
              </div>

              {!selectedVideo.sentToOptimize && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">
                    Enviar a optimizar
                  </h3>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <ProjectSelector
                        value={targetProjectId}
                        onChange={ p => setTargetProjectId(p.id) }
                      />
                    </div>
                    <Button 
                      onClick={handleSendToOptimize}
                      disabled={sendToOptimize.isPending || !targetProjectId}
                    >
                      {sendToOptimize.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Enviar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Titulin</h1>
          <p className="text-muted-foreground">
            Explorador de videos de YouTube para optimización de contenido
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar videos por título..."
                  className="pl-8"
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full sm:w-[260px]">
              <Select
                value={channelFilter}
                onValueChange={setYoutubeChannelFilter}
              >
                <SelectTrigger>
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

            <div className="w-full sm:w-[140px]">
              <Select
                value={limit.toString()}
                onValueChange={(value) => setLimit(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mostrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="25">25 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                  <SelectItem value="100">100 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {isLoadingVideos ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No hay videos disponibles</h3>
          <p className="text-muted-foreground mt-1">
            Intenta cambiar los filtros o añadir más canales
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={filteredVideos}
          />
          
          {paginationMetadata && paginationMetadata.totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(page - 1)}
                    />
                  </PaginationItem>
                  
                  {renderPaginationItems()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(page + 1)}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              <div className="text-center text-sm text-muted-foreground mt-2">
                Mostrando {filteredVideos.length} de {paginationMetadata.totalVideos} videos • 
                Página {paginationMetadata.page} de {paginationMetadata.totalPages}
              </div>
            </div>
          )}
        </div>
      )}

      {renderVideoDialog()}
    </div>
  );
}

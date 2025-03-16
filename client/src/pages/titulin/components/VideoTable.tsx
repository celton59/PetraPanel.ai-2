import { useEffect, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "./DataTable";
import { TitulinVideo } from "@/hooks/useTitulin";

interface VideoTableProps {
  videos: TitulinVideo[];
  setSelectedVideo: (video: TitulinVideo) => void;
  setAnalysisVideo?: (video: TitulinVideo) => void;
  getChannelName: (channelId: string) => string;
  isLoading?: boolean;
  onSortingChange?: (sorting: SortingState) => void;
  handleDownloadCSV?: () => void;
  isDownloading?: boolean;
}

export function VideoTable({ 
  videos, 
  setSelectedVideo, 
  setAnalysisVideo, 
  getChannelName,
  isLoading = false,
  onSortingChange,
  handleDownloadCSV,
  isDownloading = false
}: VideoTableProps) {
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState<ColumnDef<TitulinVideo>[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "publishedAt", desc: true } 
  ]);

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

  useEffect(() => {
    setColumns([
      {
        accessorKey: "thumbnailUrl",
        header: "Miniatura",
        enableSorting: false,
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
        sortingFn: (rowA, rowB) => {
          const aValue = Number(rowA.original.viewCount || 0);
          const bValue = Number(rowB.original.viewCount || 0);
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        },
        cell: ({ row }) => (
          <span>{Number(row.original.viewCount || 0).toLocaleString()}</span>
        ),
      },
      {
        accessorKey: "likeCount",
        header: "Likes",
        sortingFn: (rowA, rowB) => {
          const aValue = Number(rowA.original.likeCount || 0);
          const bValue = Number(rowB.original.likeCount || 0);
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        },
        cell: ({ row }) => (
          <span>{Number(row.original.likeCount || 0).toLocaleString()}</span>
        ),
      },
      {
        id: "publishedAt",
        header: "Publicado",
        accessorFn: (row) => {
          return row.publishedAt || null;
        },
        sortingFn: (rowA, rowB) => {
          const aValue = rowA.original.publishedAt
          const bValue = rowB.original.publishedAt          
          const aTime = aValue ? new Date(aValue).getTime() : 0;
          const bTime = bValue ? new Date(bValue).getTime() : 0;          
          return aTime < bTime ? -1 : aTime > bTime ? 1 : 0;
        },
        cell: ({ row }) => {
          const dateValue = row.original.publishedAt
          return <span>{formatDate(dateValue)}</span>;
        },
      },
      {
        accessorKey: "duration",
        header: "Duración",
        sortingFn: (rowA, rowB) => {
          const getDurationInSeconds = (duration: string | null) => {
            if (!duration) return 0;
            const hours = parseInt(duration.match(/(\d+)H/)?.[1] || '0');
            const minutes = parseInt(duration.match(/(\d+)M/)?.[1] || '0');
            const seconds = parseInt(duration.match(/(\d+)S/)?.[1] || '0');
            return hours * 3600 + minutes * 60 + seconds;
          };
          const aValue = getDurationInSeconds(rowA.original.duration);
          const bValue = getDurationInSeconds(rowB.original.duration);
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        },
        cell: ({ row }) => (
          <span>{formatDuration(row.original.duration)}</span>
        ),
      },
      {
        accessorKey: "channelId",
        header: "Canal",
        sortingFn: (rowA, rowB) => {
          const aValue = getChannelName(rowA.original.channelId);
          const bValue = getChannelName(rowB.original.channelId);
          return aValue.localeCompare(bValue);
        },
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate">
            {getChannelName(row.original.channelId)}
          </div>
        ),
      },
      {
        accessorKey: "analysisData",
        header: "Evergreen",
        sortingFn: (rowA, rowB) => {
          if (!rowA.original.analyzed && !rowB.original.analyzed) return 0;
          if (!rowA.original.analyzed) return 1;
          if (!rowB.original.analyzed) return -1;
          if (!rowA.original.analysisData && !rowB.original.analysisData) return 0;
          if (!rowA.original.analysisData) return 1;
          if (!rowB.original.analysisData) return -1;
          if (rowA.original.isEvergreen !== rowB.original.isEvergreen) {
            return rowA.original.isEvergreen ? -1 : 1;
          }
          return parseFloat(rowB.original.evergreenConfidence ?? '0') - parseFloat(rowA.original.evergreenConfidence ?? '0');
        },
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
              <Badge variant={video.isEvergreen ? "default" : "secondary"}>
                {video.isEvergreen ? "Evergreen" : "No Evergreen"}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {Math.round(parseFloat(video.evergreenConfidence ?? '0') * 100)}% confianza
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => {
          const video = row.original;
          return (
            <div className="flex flex-col gap-2">
              {setAnalysisVideo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAnalysisVideo(video)}
                  className="w-full"
                >
                  Análisis Detallado
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVideo(video)}
                className="w-full"
                disabled={Boolean(video.sentToOptimize)}
              >
                {video.sentToOptimize ? "Ya enviado" : "Enviar a Optimización"}
              </Button>
            </div>
          );
        }
      }
    ]);
  }, [analyzeEvergeenMutation.isPending, getChannelName, setSelectedVideo, setAnalysisVideo]);

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting);
    if (onSortingChange) {
      onSortingChange(newSorting);
    }
  };

  return (
    <div className="border">
      {handleDownloadCSV && (
        <div className="flex justify-end p-4 border-b">
          <Button
            variant="outline"
            onClick={handleDownloadCSV}
            disabled={isDownloading}
            className="h-9"
            aria-label="Descargar CSV"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            <span>Exportar videos</span>
          </Button>
        </div>
      )}
      <div className="rounded-md">
        <DataTable 
          columns={columns} 
          data={videos} 
          initialSorting={sorting}
          onSortingChange={handleSortingChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
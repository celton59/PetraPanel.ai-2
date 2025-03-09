import { DataTable } from "../DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { TitulinVideo } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

interface VideoTableProps {
  videos: TitulinVideo[];
  setSelectedVideo: (video: TitulinVideo) => void;
  getChannelName: (channelId: string) => string;
}

export function VideoTable({ videos, setSelectedVideo, getChannelName }: VideoTableProps) {
  const queryClient = useQueryClient();

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

  return (
    <div className="rounded-md border">
      <DataTable
        columns={columns}
        data={videos}
      />
    </div>
  );
}
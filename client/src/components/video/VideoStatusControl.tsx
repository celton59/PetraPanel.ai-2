import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VideoStatus } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Clock, Edit3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface VideoStatusControlProps {
  videoId: number;
  currentStatus: VideoStatus;
  userRole: string;
  onUpdateStatus: (videoId: number, data: { status: VideoStatus; lastReviewComments?: string }) => Promise<void>;
}

const getNextStatuses = (currentRole: string, currentStatus: VideoStatus): VideoStatus[] => {
  const statusTransitions: Record<string, Record<VideoStatus, VideoStatus[]>> = {
    optimizer: {
      pending: ["in_progress"],
      in_progress: ["optimize_review"],
      title_corrections: ["optimize_review"],
      optimize_review: ["completed"],
    },
    reviewer: {
      optimize_review: ["in_progress", "title_corrections", "completed"],
      in_progress: ["completed", "title_corrections"],
      title_corrections: ["optimize_review", "in_progress", "completed"],
    },
    uploader: {
      upload_review: ["review", "media_corrections"],
      media_corrections: ["review"],
    },
    admin: {
      pending: ["in_progress"],
      in_progress: ["optimize_review"],
      title_corrections: ["optimize_review"],
      optimize_review: ["upload_review", "title_corrections"],
      upload_review: ["review", "media_corrections"],
      review: ["youtube_ready", "media_corrections"],
      media_corrections: ["review"],
      youtube_ready: ["completed"],
    },
  };

  return statusTransitions[currentRole]?.[currentStatus] || [];
};

// Expandir getStatusLabel para incluir sub-estados del reviewer
const getStatusLabel = (status: VideoStatus | string, role?: string): string => {
  // Estados para optimizador
  if (role === 'optimizer') {
    if (status === 'pending') return "Disponible";
    if (status === 'in_progress') return "En Proceso";
    if (status === 'optimize_review') return "En Revisión";
    if (status === 'title_corrections') return "Con Correcciones";
    if (status === 'completed') return "Completado";
  }

  // Sub-estados de youtuber
  if (status === 'video_disponible') return "Video Disponible";
  if (status === 'asignado') return "Asignado";

  // Sub-estados de optimizer
  if (status === 'disponible') return "Título Disponible";
  if (status === 'pendiente_revision') return "Pendiente de Revisión";
  if (status === 'en_revision') return "En Revisión";

  // Sub-estados generales
  if (status === 'needs_attention') return "Necesita Atención";

  // Estados principales permanecen igual...
  const labels: Record<string, Record<VideoStatus | string, string>> = {
    optimizer: {
      pending: "Disponible",
      in_progress: "En Proceso",
      title_corrections: "Con Correcciones",
      optimize_review: "En Revisión",
      upload_review: "Rev. Archivos",
      youtube_ready: "Listo YouTube",
      review: "Rev. Final",
      media_corrections: "Correcciones de Archivos",
      completed: "Completado"
    },
    reviewer: {
      pending: "Pendiente",
      in_progress: "En Proceso",
      title_corrections: "Correcciones de Título",
      optimize_review: "Rev. Optimización",
      upload_review: "Rev. Archivos",
      youtube_ready: "Listo YouTube",
      review: "Rev. Final",
      media_corrections: "Correcciones de Archivos",
      completed: "Completado"
    }
  };
  
  // Si existe un mapeo específico para el rol, usarlo
  if (role && labels[role]) {
    return labels[role][status] || status;
  }
  
  // Si no hay rol o no tiene mapeo específico, usar etiquetas por defecto
  const defaultLabels: Record<VideoStatus, string> = {
    pending: "Pendiente",
    in_progress: "En Proceso",
    title_corrections: "Correcciones de Título",
    optimize_review: "Rev. Optimización",
    upload_review: "Rev. Archivos",
    youtube_ready: "Listo YouTube",
    review: "Rev. Final",
    media_corrections: "Correcciones de Archivos",
    completed: "Completado"
  };
  return defaultLabels[status as VideoStatus] || status;
};

// Expandir getStatusDescription para incluir sub-estados
const getStatusDescription = (status: VideoStatus | string): string => {
  // Descripciones para sub-estados del reviewer
  const reviewerStateDescriptions: Record<string, string> = {
    revisando_titulo: "Estás revisando el título y la optimización",
    revisando_contenido: "Estás revisando el contenido del video",
    pendiente: "El video está pendiente de tu revisión",
    aprobado: "Has aprobado este contenido",
    rechazado: "Has rechazado este contenido y requiere cambios",
  };

  if (status in reviewerStateDescriptions) {
    return reviewerStateDescriptions[status];
  }

  // Otras descripciones...
  const subStateDescriptions: Record<string, string> = {
    video_disponible: "Video disponible para ser tomado por un youtuber",
    asignado: "Video asignado a un youtuber específico",
    disponible: "Título disponible para optimización",
    pendiente_revision: "Esperando revisión del equipo de optimización",
    en_revision: "Actualmente siendo revisado",
    needs_attention: "Requiere atención especial del equipo",
  };

  if (status in subStateDescriptions) {
    return subStateDescriptions[status];
  }

  // Estados principales permanecen igual...
  const descriptions: Record<VideoStatus, string> = {
    pending: "Video recién creado, esperando asignación",
    in_progress: "Video en proceso de optimización de título",
    title_corrections: "Se han solicitado correcciones al título",
    optimize_review: "En revisión por el equipo de optimización",
    upload_review: "En revisión de archivos (video y miniatura)",
    youtube_ready: "Listo para subir a YouTube",
    review: "En revisión final antes de publicación",
    media_corrections: "Se han solicitado correcciones al video o miniatura",
    completed: "Video publicado en YouTube"
  };
  return descriptions[status as VideoStatus] || "Estado desconocido";
};

const getStatusIcon = (status: VideoStatus) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "title_corrections":
    case "media_corrections":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "in_progress":
      return <Edit3 className="h-5 w-5 text-blue-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

export const VideoStatusControl = ({
  videoId,
  currentStatus,
  userRole,
  onUpdateStatus,
}: VideoStatusControlProps) => {
  const [newStatus, setNewStatus] = useState<VideoStatus | null>(null);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const availableStatuses = getNextStatuses(userRole, currentStatus);
  const needsComments = newStatus === "title_corrections" || newStatus === "media_corrections";

  const handleStatusChange = async () => {
    if (!newStatus) return;

    if (needsComments && !comments.trim()) {
      toast({
        title: "Error",
        description: "Por favor, añade comentarios sobre las correcciones necesarias",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateStatus(videoId, {
        status: newStatus,
        ...(comments && { lastReviewComments: comments }),
      });

      toast({
        title: "Estado actualizado",
        description: "El estado del video se ha actualizado correctamente",
      });

      setNewStatus(null);
      setComments("");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del video",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(currentStatus)}
          <span>Estado: {getStatusLabel(currentStatus, userRole)}</span>
        </CardTitle>
        <CardDescription>
          {getStatusDescription(currentStatus)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableStatuses.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2">
              {availableStatuses.map((status) => (
                <Button
                  key={status}
                  variant={newStatus === status ? "default" : "outline"}
                  onClick={() => setNewStatus(status)}
                  className="flex items-center gap-2"
                >
                  {getStatusIcon(status)}
                  {getStatusLabel(status, userRole)}
                </Button>
              ))}
            </div>

            {newStatus && needsComments && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Comentarios sobre las correcciones necesarias
                </label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Describe las correcciones necesarias..."
                  className="min-h-[100px]"
                />
              </div>
            )}

            {newStatus && (
              <Button
                onClick={handleStatusChange}
                disabled={isSubmitting || (needsComments && !comments.trim())}
                className="w-full"
              >
                Actualizar Estado
              </Button>
            )}
          </>
        ) : (
          <Alert>
            <AlertTitle>No hay acciones disponibles</AlertTitle>
            <AlertDescription>
              No tienes permisos para cambiar el estado del video en este momento.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
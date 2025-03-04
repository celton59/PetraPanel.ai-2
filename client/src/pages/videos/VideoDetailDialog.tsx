import { Badge } from "@/components/ui/badge";
import { VideoStatus } from "@db/schema";
import {
  AlertCircle,  
} from "lucide-react";
import {  
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { UpdateVideoData } from "@/hooks/useVideos";
import { OptimizeContentDetail } from "./detail/OptimizeContentDetail";
import { ContentReviewDetail } from "./detail/OptimizeReviewContent";
import { UploadContentDetail } from "./detail/UploadContentDetail";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "@/hooks/use-user";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import MediaReviewDetail from "./detail/MediaReviewDetail";
import { ApiVideo } from "@/hooks/useVideos";

const statusDescriptions: Record<VideoStatus, string> = {
  available: "Video recién creado, esperando asignación",
  content_corrections: "Se han solicitado correcciones al título",
  content_review: "En revisión por el equipo de optimización",
  upload_media: "En revisión de archivos (video y miniatura)",
  media_review: "Listo para subir a YouTube",
  media_corrections: "Se han solicitado correcciones al video o miniatura",
  final_review: "En revisión final antes de publicación",
  completed: "Video publicado en YouTube",
};

export function VideoDetailDialog({ video, onUpdate }: VideoDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useUser();

  // Determinar si el usuario tiene visibilidad usando getRoleStatus
  // const hasVisibility = getRoleStatus(video.status as VideoStatus)[userRole] === 'disponible';
  // TODO
  const hasVisibility = true;

  if (!hasVisibility) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No tienes acceso a ver el contenido de este video en este momento.
        </AlertDescription>
      </Alert>
    );
  }

  const form = useForm<UpdateVideoData>({
    defaultValues: {
      title: video.title,
      description: video.description ?? "",
      optimizedTitle: video.optimizedTitle ?? "",
      optimizedDescription: video.optimizedDescription ?? "",
      tags: video.tags ?? "",
    },
  });


  function renderCardContent() {
    switch (video.status) {
      case "available":
      case "content_corrections":
        return (
          <OptimizeContentDetail
            video={video}
            onUpdate={onUpdate}
          />
        );
      case "content_review":
        return (
          <ContentReviewDetail
            video={video}
            onUpdate={onUpdate}
          />
        );
      case "upload_media":
      case "media_corrections":
        return (
          <UploadContentDetail
            video={video}
            onUpdate={onUpdate}
          />
        );
      case "media_review":
      case "final_review":
        return <MediaReviewDetail video={video} onUpdate={onUpdate} />;      
    }
  }

  const statusColor = getStatusBadgeColor(video.status)
  const statusLabel = getStatusLabel(user!.role, video);

  return (
    <DialogContent className="w-[95vw] max-w-3xl p-6 relative overflow-hidden top-[5vh] max-h-[90vh] fixed">
      <DialogDescription className="sr-only">Detalles del video</DialogDescription>
      {/* Rich gradient accent for video detail */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-primary to-purple-600"></div>
      <DialogHeader>
        <div className="flex justify-between items-start">
          <DialogTitle className="text-2xl">
            {hasVisibility ? (
              (video.optimizedTitle ?? video.title)
            ) : (
              <span className="text-muted-foreground italic">
                Título no disponible
              </span>
            )}
          </DialogTitle>
          <div className="pe-6">
            <div className="flex justify-end">
              <Badge
                variant="outline"
                className={`${statusColor} border-0 text-lg py-1 px-2`}
              >
                {statusLabel}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {statusDescriptions[video.status]}
            </p>
          </div>
        </div>
      </DialogHeader>

      {renderCardContent()}
    </DialogContent>
  );
}

interface VideoDetailDialogProps {
  video: ApiVideo;
  onUpdate: (data: UpdateVideoData, keepDialog?: boolean) => Promise<void>;
}
